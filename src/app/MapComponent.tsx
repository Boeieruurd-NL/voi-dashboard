import { Card, Text, Grid, Col } from "@tremor/react";
import * as React from 'react';
import Map, { Marker, Popup } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = 'pk.eyJ1IjoiamFzcGVydmV5Y2siLCJhIjoiY2xubG1qY3ZkMTE0cjJxczNwcTEzNzY4eSJ9.xSkEI67YO6CwCkDDnGFdZA'; 

export default function MapComponent({ activeTab }) {
  
  const mapRef = React.useRef(null);
  const [nodes, setNodes] = React.useState([]);
  const [selectedNode, setSelectedNode] = React.useState(null);

  React.useEffect(() => {
    fetch('https://voi-node-info.boeieruurd.com/api/relay-nodes')
      .then(response => response.json())
      .then(data => setNodes(data));

    if (activeTab === 2 && mapRef.current) {
      const mapInstance = mapRef.current.getMap();
      mapInstance.resize();
    }
  }, [activeTab]);

  return (
    <main>
      <Grid numItemsLg={1} className="gap-6 mt-6">
        <Card className="flex flex-col" style={{ height: '75vh' }}>
          <Col className="flex-grow flex">
            <div className="w-full h-full rounded-xl overflow-hidden">
              <Map
                ref={mapRef}
                style={{width: '100%', height: '100%' }}
                initialViewState={{
                    longitude: 4.897070,
                    latitude: 52.377956,
                    zoom: 4,
                }}
                mapStyle="mapbox://styles/jasperveyck/clnezqfz403tk01nzeyrnh9i5"
                mapboxAccessToken={MAPBOX_TOKEN}
                projection={"globe" as any}
                attributionControl={false}
              >
               {nodes.map(node => (
  <React.Fragment key={node.ip}>
    <Marker longitude={node.lon} latitude={node.lat}>
      <div 
        onClick={() => setSelectedNode(node)}
        style={{ position: 'relative', width: '10px', height: '10px' }}
      >
        {/* Outer animated circle */}
        <div 
          className="pulseScale"
          style={{ 
            background: '#B42222', 
            borderRadius: '50%', 
            position: 'absolute', 
            top: '-3px', 
            left: '-3px', 
            width: '14px', 
            height: '14px', 
            zIndex: -1 
          }}
        ></div>
        {/* Inner static circle */}
        <div 
          className="pulseOpacity"
          style={{ 
            background: '#c99393', 
            borderRadius: '50%', 
            width: '8px', 
            height: '8px' 
          }}
        ></div>
      </div>
    </Marker>
    {selectedNode && selectedNode.ip === node.ip && (
      <Popup
        latitude={node.lat}
        longitude={node.lon}
        onClose={() => setSelectedNode(null)}
      >
        <div>
          <h4>{node.domain}</h4>
          <p>{node.city}, {node.country}</p>
          <p>IP: {node.ip}</p>
        </div>
      </Popup>
    )}
  </React.Fragment>
))}

               
              </Map>
            </div>
          </Col>
        </Card>
      </Grid>
    </main>
  );
}