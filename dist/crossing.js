// Gets border waiting times to US.

// crossing <port_name>
var build_name, delay_time, parser, safe_element;

parser = require('xml2json');

String.prototype.minimize = function() {
  return this.toLowerCase().replace(/\ /g, '');
};

delay_time = function(port_object) {
  if (port_object["operational_status"].match(/N\/A|closed/gi)) {
    return "N/A";
  }
  return port_object["delay_minutes"];
};

build_name = function(port_object) {
  var name;
  name = port_object['port_name'];
  if (!(port_object['crossing_name'] instanceof Object)) {
    name += ` ${port_object['crossing_name']}`;
  }
  return name;
};

safe_element = function(port_object, element) {
  if (port_object[element] instanceof Object) {
    return "N/A";
  }
  return port_object[element];
};

module.exports = function(robot) {
  return robot.respond(/crossing (.*)$/i, function(msg) {
    var message, port_name;
    port_name = msg.match[1];
    message = "";
    return msg.http('http://apps.cbp.gov/bwt/bwt.xml').get()(function(err, res, body) {
      var border, i, json_border_data, len, port;
      json_border_data = parser.toJson(body);
      border = JSON.parse(json_border_data)["border_wait_time"]["port"];
      for (i = 0, len = border.length; i < len; i++) {
        port = border[i];
        if (port.port_name.minimize() === port_name.minimize()) {
          message += `${build_name(port)}\n` + `Updated at ${safe_element(port, 'date')} ${safe_element(port['passenger_vehicle_lanes']['standard_lanes'], 'update_time')}\n` + `Port is now ${port['port_status']}\n` + `Normal Lanes: ${delay_time(port['passenger_vehicle_lanes']['standard_lanes'])}\n` + `SENTRI: ${delay_time(port['passenger_vehicle_lanes']['NEXUS_SENTRI_lanes'])}\n` + `Ready Lanes: ${delay_time(port['passenger_vehicle_lanes']['ready_lanes'])}\n` + `Pedestrian: ${delay_time(port['pedestrian_lanes']['standard_lanes'])}\n`;
        }
      }
      if (message.minimize() === "") {
        message = `I don't know where ${port_name} is`;
      }
      return msg.send(message);
    });
  });
};
