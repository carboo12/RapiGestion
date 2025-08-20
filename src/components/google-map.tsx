'use client';
import { useEffect, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

interface Marker {
    lat: number;
    lng: number;
    label?: string;
}

interface GoogleMapProps {
    markers: Marker[];
}

const GoogleMap: React.FC<GoogleMapProps> = ({ markers }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const nicaraguaCenter = { lat: 12.8654, lng: -85.2072 };

    useEffect(() => {
        const loader = new Loader({
            apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
            version: 'weekly',
        });

        loader.load().then(async () => {
            const { Map } = await google.maps.importLibrary("maps") as google.maps.MapsLibrary;
            const { Marker } = await google.maps.importLibrary("marker") as google.maps.MarkerLibrary;

            if (mapRef.current) {
                const map = new Map(mapRef.current, {
                    center: nicaraguaCenter,
                    zoom: 6,
                    mapId: 'DEMO_MAP_ID', // Replace with your Map ID if you have one
                });

                const bounds = new google.maps.LatLngBounds();

                if (markers.length > 0) {
                    markers.forEach(markerInfo => {
                        const position = { lat: markerInfo.lat, lng: markerInfo.lng };
                        new Marker({
                            position,
                            map,
                            label: markerInfo.label,
                            title: markerInfo.label,
                        });
                        bounds.extend(position);
                    });
                    
                    if (markers.length === 1) {
                        map.setCenter(bounds.getCenter());
                        map.setZoom(14);
                    } else {
                        map.fitBounds(bounds);
                    }

                } else {
                    map.setCenter(nicaraguaCenter);
                    map.setZoom(6);
                }
            }
        }).catch(e => {
            console.error("Error loading Google Maps", e);
        });
    }, [markers, nicaraguaCenter]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
};

export default GoogleMap;
