import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../core/l10n/app_localizations.dart';

class MapScreen extends StatelessWidget {
  const MapScreen({super.key});

  static final List<LatLng> _demoSpots = [
    const LatLng(27.2579, 33.8116), // Hurghada
    const LatLng(30.0444, 31.2357), // Cairo / Nile
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('map.title')),
      ),
      body: FlutterMap(
        options: const MapOptions(
          initialCenter: LatLng(30.0444, 31.2357),
          initialZoom: 6,
        ),
        children: [
          TileLayer(
            urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            userAgentPackageName: 'com.sennara.app',
          ),
          MarkerLayer(
            markers: _demoSpots.asMap().entries.map((entry) {
              return Marker(
                point: entry.value,
                width: 40,
                height: 40,
                child: Icon(
                  Icons.location_on,
                  color: entry.key == 0 ? Colors.red : Colors.blue,
                  size: 36,
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}
