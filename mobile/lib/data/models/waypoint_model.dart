class WaypointModel {
  final String? id;
  final String name;
  final String? description;
  final double latitude;
  final double longitude;
  final String privacy;
  final String waypointType;
  final String? waterBody;
  final double? depthMeters;

  WaypointModel({
    this.id,
    required this.name,
    this.description,
    required this.latitude,
    required this.longitude,
    this.privacy = 'secret',
    this.waypointType = 'catch_spot',
    this.waterBody,
    this.depthMeters,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'description': description,
        'latitude': latitude,
        'longitude': longitude,
        'privacy': privacy,
        'waypointType': waypointType,
        'waterBody': waterBody,
        'depthMeters': depthMeters,
      };

  factory WaypointModel.fromJson(Map<String, dynamic> json) => WaypointModel(
        id: json['id'] as String?,
        name: json['name'] as String,
        description: json['description'] as String?,
        latitude: (json['location']['latitude'] as num).toDouble(),
        longitude: (json['location']['longitude'] as num).toDouble(),
        privacy: json['privacy'] as String? ?? 'secret',
        waypointType: json['waypointType'] as String? ?? 'catch_spot',
        waterBody: json['waterBody'] as String?,
        depthMeters: (json['depthMeters'] as num?)?.toDouble(),
      );
}
