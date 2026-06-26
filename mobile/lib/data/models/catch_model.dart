class CatchModel {
  final String? id;
  final String? speciesId;
  final String? waypointId;
  final double? weightKg;
  final double? lengthCm;
  final String? baitType;
  final String? lureType;
  final String? technique;
  final String? description;
  final List<String> photoUrls;
  final List<String> videoUrls;
  final String privacy;
  final double latitude;
  final double longitude;
  final DateTime? catchDate;
  final Map<String, dynamic> weather;

  CatchModel({
    this.id,
    this.speciesId,
    this.waypointId,
    this.weightKg,
    this.lengthCm,
    this.baitType,
    this.lureType,
    this.technique,
    this.description,
    this.photoUrls = const [],
    this.videoUrls = const [],
    this.privacy = 'friends_only',
    required this.latitude,
    required this.longitude,
    this.catchDate,
    this.weather = const {},
  });

  Map<String, dynamic> toJson() => {
        'speciesId': speciesId,
        'waypointId': waypointId,
        'weightKg': weightKg,
        'lengthCm': lengthCm,
        'baitType': baitType,
        'lureType': lureType,
        'technique': technique,
        'description': description,
        'photoUrls': photoUrls,
        'videoUrls': videoUrls,
        'privacy': privacy,
        'latitude': latitude,
        'longitude': longitude,
        'catchDate': catchDate?.toIso8601String(),
        'weather': weather,
      };

  factory CatchModel.fromJson(Map<String, dynamic> json) => CatchModel(
        id: json['id'] as String?,
        speciesId: json['speciesId'] as String?,
        waypointId: json['waypointId'] as String?,
        weightKg: (json['weightKg'] as num?)?.toDouble(),
        lengthCm: (json['lengthCm'] as num?)?.toDouble(),
        baitType: json['baitType'] as String?,
        lureType: json['lureType'] as String?,
        technique: json['technique'] as String?,
        description: json['description'] as String?,
        photoUrls: List<String>.from(json['photoUrls'] ?? []),
        videoUrls: List<String>.from(json['videoUrls'] ?? []),
        privacy: json['privacy'] as String? ?? 'friends_only',
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        catchDate:
            json['catchDate'] != null ? DateTime.parse(json['catchDate']) : null,
        weather: Map<String, dynamic>.from(json['weather'] ?? {}),
      );
}
