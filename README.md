# docker-tailscale-monitor

![](/docker/grafana/provisioning/grafana-sample.png)

Docker setup consisting out of Grafana incl. a pre-configured dashboard, InfluxDB and Tailscale incl. a excelletn VPN network solution.

## Installation

1. Make sure you've installed all requirements
2. Clone this repository:

```shell
git clone https://github.com/xinmans/docker-tailscale-monitor.git
```

3. Create a copy of the sample `.env` file and adjust it at will:

```shell
cd docker-tailscale-monitor
cp .env.sample .env
```
4. edit .env, change TAILSCALE_SKEY & TAILSCALE_USER to your value
login https://login.tailscale.com/admin/settings/keys to enable the API keys

```
TAILSCALE_SKEY=tsky-xxx-xxxxx
TAILSCALE_USER=xxxx@xxxx.com
```

5. Spin up the containers:

```shell
docker-compose up -d
```

## Configuration

You can make use of the following environment variables / configurations:

| Environment variable | Default value | Description
|----------------------|---------------|------------|
| `GRAFANA_PORT` | `3000` | Port to bind Grafana webinterface on the host system |
| `TAILSCALE_INTERVAL` | `3600` | Interval/pause (in seconds) between monitor |
| `TAILSCALE_HOST` | `local` | Display name of the client |
| `TAILSCALE_SKEY` | your tailscale skey | like  tskey-XXXX-XXXXXXXX|
| `TAILSCALE_USER` | your tailscale userid| email like xxx@xx.com|
| `INFLUXDB_DB` | `tailscale` | Database to save tailscale results |
| `INFLUXDB_HOST` | `influxdb` | Name of the InfluxDB host/containers |
| `INFLUXDB_USERNAME` | `root` | Username for InfluxDB authentication |
| `INFLUXDB_PASSWORD` | `root` | Password for InfluxDB authentication |

## Usage

### Services

#### Start/create services


```shell
$ docker-compose up -d
Creating docker-tailscale_influxdb_1  ... done
Creating docker-tailscale_grafana_1   ... done
Creating docker-tailscale_monitor     ... done

```

#### Stop services

```shell
$ docker-compose stop
Stopping docker-tailscale_influxdb_1  ... done
Stopping docker-tailscale_grafana_1   ... done
Stopping docker-tailscale_monitor     ... done
```

#### Upgrade services

```shell
$ docker-compose stop
$ docker-compose pull
$ docker-compose rm
$ docker-compose up -d
```

#### Check logs

```shell
$ docker-compose logs -f
```

```shell
$ docker-compose logs -f grafana
```

### Grafana

#### Dashboard

By default the dashboard shows all speedtest results. To filter for a specifc host, simply add a `and host = 'local'` statement in the `WHERE` clause of the SQL select.

Example (Download Time Serie):

```
SELECT  hostname,os,id,clientVersion,addresses,Relay901latencyMs  FROM "devicestatus" WHERE $timeFilter ORDER BY time DESC
```

#### Administrative access

Access `http://${HOSTNAME}:${GRAFANA_PORT}` ([http://localhost:3000](`http://localhost:3000`) by default) and login using the following default credentials:

* Username: `admin`
* Password: `admin`

## Contributing

1. Fork it
2. Create your feature branch:

```shell
git checkout -b feature/my-new-feature
```

3. Commit your changes:

```shell
git commit -am 'Add some feature'
```

4. Push to the branch:

```shell
git push origin feature/my-new-feature
```

5. Submit a pull request

## Requirements / Dependencies

* Docker (incl. `docker-compose`)

## Version

1.0.0

## License

[MIT](LICENSE)
