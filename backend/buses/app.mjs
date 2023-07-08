import axios from 'axios';
import AWS from 'aws-sdk';
const eventbridge = new AWS.EventBridge();

const schenectady_bus_lines = {
	351: 'Van Vranken Avenue and Broadway',
	352: 'McClellan Street & Altamont Avenue',
	353: 'Scotia and Mt. Pleasant',
	354: 'Rotterdam Square Mall and Nott Street',
	355: 'Schenectady / Colonie',
	370: 'Troy/Schenectady',
	450: 'Schenectady-Wilton Mall via Route 50',
	530: 'Rotterdam Square Mall Express',
	531: "St. Luke's/Woodlawn",
	763: 'Albany/Schenectady',
	810: 'Schenectady - Albany Shuttle',
	905: 'BusPlus -- Albany / Schenectady',
};

export const lambdaHandler = async (event, context) => {
	const res = await axios.get('https://www.cdta.org/realtime/buses.json');
	const data = res?.data;

	const busLocations = [];
	const busSeatCapacity = [];

	data.forEach((bus) => {
		//only get buses running in Schenectady
		if (schenectady_bus_lines[bus?.route_id]) {
			busLocations.push({
				lat: bus?.lat,
				long: bus?.lng,
				bearing: Number(bus?.bearing),
				info: {
					headsign: bus?.trip_headsign,
					stop: bus?.stop_name,
					route: schenectady_bus_lines[bus?.route_id],
					route_id: bus?.route_id,
				},
			});
			busSeatCapacity.push({
				headsign: bus?.trip_headsign,
				occupancy_level: bus?.occupancy,
				route: schenectady_bus_lines[bus?.route_id],
			});
		}
	});

	// Send out the capacity to an eventbridge to be processed by another lambda
	// console.log('/////////Seating Capacity//////////');
	// console.log(busSeatCapacity);
	// console.log('///////////////////////////////////');

	try {
		return {
			statusCode: 200,
			headers: {
				'Access-Control-Allow-Headers': 'Content-Type',
				'Access-Control-Allow-Origin': '*', // Allow from anywhere
				'Access-Control-Allow-Methods': 'GET', // Allow only GET request
			},
			body: JSON.stringify({
				message: JSON.stringify(busLocations),
			}),
		};
	} catch (err) {
		console.log(err);
		return err;
	}
};
