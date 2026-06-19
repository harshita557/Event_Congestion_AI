import {
MapContainer,
TileLayer,
CircleMarker,
Popup
} from "react-leaflet";


import "leaflet/dist/leaflet.css";



function MapView({history}){


const zones = {


"Central Zone 1":[9.9312,76.2673],

"Central Zone 2":[9.9350,76.2700],

"North Zone 1":[10.0150,76.3500],

"North Zone 2":[10.0250,76.3600],

"South Zone 1":[9.8800,76.2900],

"South Zone 2":[9.8700,76.3000],

"East Zone 1":[9.9500,76.4000],

"East Zone 2":[9.9600,76.4100],

"West Zone 1":[9.9000,76.2200],

"West Zone 2":[9.8900,76.2100]

};





function color(risk){

if(risk==="HIGH")
return "red";


if(risk==="MEDIUM")
return "orange";


return "green";

}




return (

<MapContainer

center={[9.9312,76.2673]}

zoom={12}

style={{
height:"400px",
width:"100%",
borderRadius:"20px"
}}

>



<TileLayer

url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"

/>



{


history.map((event)=>(


<CircleMarker


key={event.id}


center={
zones[event.zone] || [9.9312,76.2673]
}


radius={20}


pathOptions={{

color:color(event.risk)

}}


>


<Popup>


<h3>
{event.event_cause}
</h3>


<p>

Zone:
{event.zone}

</p>


<p>

Risk:
{event.risk}

</p>


<p>

Police:
{event.police}

</p>



</Popup>


</CircleMarker>


))


}



</MapContainer>


)


}


export default MapView;