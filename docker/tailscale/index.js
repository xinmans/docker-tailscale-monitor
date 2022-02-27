const execa = require("execa");
const Influx = require("influx");
const delay = require("delay");
const moment = require('moment');
const os = require("os");

process.env.INFLUXDB_HOST = (process.env.INFLUXDB_HOST) ? process.env.INFLUXDB_HOST : 'localhost';
process.env.INFLUXDB_DB = (process.env.INFLUXDB_DB) ? process.env.INFLUXDB_DB : 'tailscale';
process.env.INFLUXDB_USERNAME = (process.env.INFLUXDB_USERNAME) ? process.env.INFLUXDB_USERNAME : 'root';
process.env.INFLUXDB_PASSWORD = (process.env.INFLUXDB_PASSWORD) ? process.env.INFLUXDB_PASSWORD : 'root';
process.env.TAILSCALE_HOST = (process.env.TAILSCALE_HOST) ? process.env.TAILSCALE_HOST : 'ubuntu';
process.env.TAILSCALE_INTERVAL = (process.env.TAILSCALE_INTERVAL) ? process.env.TAILSCALE_INTERVAL : 3600;
const TAILSCALE_SKEY = process.env.TAILSCALE_SKEY + ':';
const TAILSCALE_USER = process.env.TAILSCALE_USER;

const log = (message, severity = "Info") =>
  console.log(`[${severity.toUpperCase()}][${(moment(new Date).format("YYYY-MM-DD HH:mm:ss"))}] ${message}`);

async function getLatencybyid(id) {
	const args = [ "https://api.tailscale.com/api/v2/device/" + id + "?fields=all", "-u", TAILSCALE_SKEY ];
  	var { stdout } = await execa.sync("curl", args);
	var result = JSON.parse(stdout);
	var latency = result.clientConnectivity.latency;
	var relay = Object.keys(latency)[0];
	if (relay == "Relay #901") {
		var latencyMs = latency[Object.keys(latency)[0]].latencyMs;
 	} else {
		var latencyMs = 0;
	}
	return {
		hostname: result.hostname,
		addresses: result.addresses[0],
		id: result.id,
		os: result.os,
		clientVersion: result.clientVersion,
		Relay901latencyMs: latencyMs.toFixed(2)
	};
};

async function getDeviceStatus(influx, ids){
	await influx.getDatabaseNames().then(names => {
		if (!names.includes(process.env.INFLUXDB_DB)) {
			return influx.createDatabase(process.env.INFLUXDB_DB);
		}
	});
	await ids.forEach(async function(id,index){
		var res = await getLatencybyid(id)
		var tailscaleMetricsStr = JSON.stringify(res);
		var tailscaleMetrics = JSON.parse(tailscaleMetricsStr);
		log(
			`Tailscale results - hostname: ${tailscaleMetrics.hostname}, addresses: ${tailscaleMetrics.addresses}, id: ${tailscaleMetrics.id}, os: ${tailscaleMetrics.os}, clientVersion: ${tailscaleMetrics.clientVersion}, Relay901latencyMs: ${tailscaleMetrics.Relay901latencyMs}`
		);
		await influx.writePoints([
			{
				measurement: 'devicestatus',
				tags: { host: os.hostname() },
				fields: { 
					hostname: tailscaleMetrics.hostname, 
					addresses: tailscaleMetrics.addresses,
					id: tailscaleMetrics.id,
					os: tailscaleMetrics.os,
					clientVersion: tailscaleMetrics.clientVersion,
					Relay901latencyMs: tailscaleMetrics.Relay901latencyMs
				},
			}
		]);

		await delay(process.env.TAILSCALE_INTERVAL * 60);
	});
};

const getDevices = async () => {
  var args = [ "https://api.tailscale.com/api/v2/tailnet/" + TAILSCALE_USER  + "/devices", "-u", TAILSCALE_SKEY ];
  var { stdout } = await execa("curl", args);
  var devices = JSON.parse(stdout).devices;
  var ids = [];
  devices.forEach(function(devices){
	ids.push(devices['id']);
  });
  return ids;
};

     
(async () => {
   try {
	const influx = new Influx.InfluxDB({
		host: process.env.INFLUXDB_HOST,
		database: process.env.INFLUXDB_DB,
		username: process.env.INFLUXDB_USERNAME,
		password: process.env.INFLUXDB_PASSWORD,
		schema: [
			{
			measurement: 'devicestatus',
			fields: {
				hostname: Influx.FieldType.STRING,
				addresses: Influx.FieldType.STRING,
				id: Influx.FieldType.STRING,
				os: Influx.FieldType.STRING,
				clientVersion: Influx.FieldType.STRING,
				Relay901latencyMs: Influx.FieldType.FLOAT
			},
			tags: [
				'host'
			]
		    }
		]
	});
   while (true) {
      log("Starting get tailscale derper status from api.tailscale.com ...");
      const deviceids = await getDevices();
      await getDeviceStatus(influx, deviceids);
      log(`Sleeping for ${process.env.TAILSCALE_INTERVAL} seconds...`);
      await delay(process.env.TAILSCALE_INTERVAL * 1000);
    }
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
})();
