import streamlit as st
import pydeck as pdk
import pandas as pd
import heapq
import os
import requests
from dotenv import load_dotenv
from graph_data import graph, locations

# Load environment variables
load_dotenv()
MAPBOX_TOKEN = os.getenv(
    "MAPBOX_TOKEN",
    "pk.eyJ1IjoibWFubmVydWhpdGVzaCIsImEiOiJjbWd4cmI5NGkwcDFlMmlzZHRvdXVibGc3In0.96biyH_bSsHppkzMwBVVGA"
)
ORS_KEY = os.getenv("ORS_API_KEY")

os.environ["MAPBOX_API_KEY"] = MAPBOX_TOKEN

# -------------------- Dijkstra Algorithm --------------------
def dijkstra(graph, start, end):
    distances = {node: float("inf") for node in graph}
    distances[start] = 0
    pq = [(0, start)]
    parent = {start: None}

    while pq:
        current_distance, current_node = heapq.heappop(pq)
        if current_node == end:
            break
        for neighbor, weight in graph[current_node]:
            distance = current_distance + weight
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                parent[neighbor] = current_node
                heapq.heappush(pq, (distance, neighbor))

    # Reconstruct path
    path = []
    node = end
    while node is not None:
        path.insert(0, node)
        node = parent.get(node)
    return path, distances[end]


# -------------------- Get Real Route (OpenRouteService) --------------------
def get_route_coordinates(start_coords, end_coords):
    if not ORS_KEY:
        return [start_coords, end_coords]  # fallback to straight line

    url = "https://api.openrouteservice.org/v2/directions/driving-car"
    headers = {"Authorization": ORS_KEY, "Content-Type": "application/json"}
    body = {
        "coordinates": [
            [start_coords[1], start_coords[0]],  # lon, lat
            [end_coords[1], end_coords[0]],
        ]
    }

    try:
        response = requests.post(url, json=body, headers=headers)
        data = response.json()
        coords = data["features"][0]["geometry"]["coordinates"]
        # convert to (lat, lon)
        return [(c[1], c[0]) for c in coords]
    except Exception as e:
        print("ORS Error:", e)
        return [start_coords, end_coords]


# -------------------- Streamlit UI --------------------
st.set_page_config(page_title="Vizag Shortest Path Finder", layout="wide")

st.title("🚗 Vizag Road Path Finder using Dijkstra + OpenRouteService")
st.sidebar.header("🔍 Search Route")

source = st.sidebar.selectbox("From:", list(graph.keys()))
destination = st.sidebar.selectbox("To:", list(graph.keys()))

if st.sidebar.button("Find Shortest Path"):
    if source == destination:
        st.warning("Source and destination cannot be the same.")
    else:
        path, total_distance = dijkstra(graph, source, destination)

        st.success(f"Shortest path from *{source}* to *{destination}*:") 
        st.write(" → ".join(path))
        st.info(f"Total distance: {total_distance} km")

        # ✅ Get road-following coordinates
        full_route = []
        for i in range(len(path) - 1):
            start = locations[path[i]]
            end = locations[path[i + 1]]
            segment = get_route_coordinates(start, end)
            full_route.extend(segment)

        route_df = pd.DataFrame(full_route, columns=["lat", "lon"])

        all_points = pd.DataFrame(
            [{"name": name, "lat": lat, "lon": lon} for name, (lat, lon) in locations.items()]
        )

        path_layer = pdk.Layer(
            "PathLayer",
            data=pd.DataFrame([{"path": [[lon, lat] for lat, lon in full_route]}]),
            get_path="path",
            get_color=[255, 0, 0],
            width_scale=5,
            width_min_pixels=4,
        )

        point_layer = pdk.Layer(
            "ScatterplotLayer",
            data=all_points,
            get_position=["lon", "lat"],
            get_radius=150,
            get_fill_color=[0, 0, 255],
            pickable=True,
        )

        view_state = pdk.ViewState(latitude=17.73, longitude=83.32, zoom=12)

        deck = pdk.Deck(
            map_style="mapbox://styles/mapbox/streets-v11",
            layers=[path_layer, point_layer],
            initial_view_state=view_state,
            tooltip={"text": "{name}"},
        )

        st.pydeck_chart(deck)
else:
    st.info("Select a source and destination, then click *Find Shortest Path* to view on map.")
