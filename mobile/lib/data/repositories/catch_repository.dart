import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:uuid/uuid.dart';
import '../datasources/local/app_database.dart';
import '../datasources/remote/api_service.dart';
import '../models/catch_model.dart';

class CatchRepository {
  final ApiService _api;
  final AppDatabase _db;

  CatchRepository({ApiService? api, AppDatabase? db})
      : _api = api ?? ApiService(),
        _db = db ?? AppDatabase();

  Future<CatchModel> createCatch(CatchModel catchModel, {List<File>? mediaFiles}) async {
    final results = await Connectivity().checkConnectivity();
    final hasNetwork = results.isNotEmpty && !results.contains(ConnectivityResult.none);

    if (hasNetwork) {
      final response = await _api.createCatch(catchModel);
      return CatchModel.fromJson(response['catch']);
    }

    // Offline: queue for later sync
    final id = const Uuid().v4();
    await _db.queueItem(
      id: id,
      entityType: 'catch',
      payload: catchModel.toJson(),
      mediaPaths: mediaFiles?.map((f) => f.path).toList() ?? [],
    );

    return catchModel.copyWith(id: id);
  }

  Future<List<CatchModel>> fetchFeed({
    required String feed,
    double? lat,
    double? lng,
    String? cursor,
  }) async {
    final response = await _api.listCatches(
      feed: feed,
      lat: lat,
      lng: lng,
      cursor: cursor,
    );
    final List<dynamic> items = response['catches'];
    return items.map((json) => CatchModel.fromJson(json)).toList();
  }

  Future<int> syncPendingItems() async {
    final items = await _db.getPendingItems();
    for (final item in items) {
      try {
        if (item.entityType == 'catch') {
          final payload = jsonDecode(item.payload) as Map<String, dynamic>;
          await _api.createCatch(CatchModel.fromJson(payload));
        }
        await _db.markCompleted(item.id);
      } catch (e) {
        await _db.markFailed(item.id, e.toString());
      }
    }
    return items.length;
  }
}

extension on CatchModel {
  CatchModel copyWith({String? id}) => CatchModel(
        id: id ?? this.id,
        speciesId: speciesId,
        waypointId: waypointId,
        weightKg: weightKg,
        lengthCm: lengthCm,
        baitType: baitType,
        lureType: lureType,
        technique: technique,
        description: description,
        photoUrls: photoUrls,
        videoUrls: videoUrls,
        privacy: privacy,
        latitude: latitude,
        longitude: longitude,
        catchDate: catchDate,
        weather: weather,
      );
}
