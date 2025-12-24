import math

# Each edge is (destination, distance_km)
graph = {
    "RK Beach": [("VUDA Park", 2), ("Kailasagiri", 5)],
    "VUDA Park": [("RK Beach", 2), ("Kailasagiri", 4), ("Dolphin Hill", 8)],
    "Kailasagiri": [("VUDA Park", 4), ("Simhachalam", 10)],
    "Simhachalam": [("Kailasagiri", 10), ("MVP Colony", 6)],
    "MVP Colony": [("Simhachalam", 6), ("Dolphin Hill", 7)],
    "Dolphin Hill": [("MVP Colony", 7), ("VUDA Park", 8)],
}

# Coordinates for display (latitude, longitude)
locations = {
    "RK Beach": (17.7195, 83.3422),
    "VUDA Park": (17.7199, 83.3335),
    "Kailasagiri": (17.7498, 83.3423),
    "Simhachalam": (17.7633, 83.2352),
    "MVP Colony": (17.7432, 83.3365),
    "Dolphin Hill": (17.6565, 83.2743),
}