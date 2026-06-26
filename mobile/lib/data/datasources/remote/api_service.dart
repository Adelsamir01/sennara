import 'package:dio/dio.dart';
import '../../../core/network/dio_client.dart';
import '../../models/catch_model.dart';
import '../../models/waypoint_model.dart';

class ApiService {
  final Dio _dio = DioClient().dio;

  // Auth
  Future<Map<String, dynamic>> requestOtp(String phoneNumber) async {
    final response = await _dio.post('/auth/otp/request', data: {'phoneNumber': phoneNumber});
    return response.data;
  }

  Future<Map<String, dynamic>> verifyOtp(String phoneNumber, String otp) async {
    final response = await _dio.post('/auth/otp/verify', data: {
      'phoneNumber': phoneNumber,
      'otp': otp,
    });
    return response.data;
  }

  // Catches
  Future<Map<String, dynamic>> createCatch(CatchModel catchModel) async {
    final response = await _dio.post('/catches', data: catchModel.toJson());
    return response.data;
  }

  Future<Map<String, dynamic>> listCatches({
    required String feed,
    double? lat,
    double? lng,
    String? cursor,
  }) async {
    final response = await _dio.get('/catches', queryParameters: {
      'feed': feed,
      if (lat != null) 'lat': lat,
      if (lng != null) 'lng': lng,
      if (cursor != null) 'cursor': cursor,
    });
    return response.data;
  }

  // Waypoints
  Future<Map<String, dynamic>> createWaypoint(WaypointModel waypoint) async {
    final response = await _dio.post('/waypoints', data: waypoint.toJson());
    return response.data;
  }

  Future<Map<String, dynamic>> listWaypoints({
    required double lat,
    required double lng,
    double radiusKm = 10,
  }) async {
    final response = await _dio.get('/waypoints/nearby', queryParameters: {
      'lat': lat,
      'lng': lng,
      'radiusKm': radiusKm,
    });
    return response.data;
  }

  // Weather
  Future<Map<String, dynamic>> getCurrentWeather(double lat, double lng) async {
    final response = await _dio.get('/weather/current', queryParameters: {
      'lat': lat,
      'lng': lng,
    });
    return response.data;
  }

  Future<Map<String, dynamic>> getForecast(double lat, double lng, {int days = 7}) async {
    final response = await _dio.get('/weather/forecast', queryParameters: {
      'lat': lat,
      'lng': lng,
      'days': days,
    });
    return response.data;
  }

  // Social
  Future<Map<String, dynamic>> toggleLike(String catchId) async {
    final response = await _dio.post('/feed/catches/$catchId/like');
    return response.data;
  }

  Future<Map<String, dynamic>> addComment(String catchId, String content) async {
    final response = await _dio.post('/feed/catches/$catchId/comments', data: {'content': content});
    return response.data;
  }

  // Payments
  Future<Map<String, dynamic>> initiatePayment({
    required String provider,
    required String tier,
    required int months,
    String? walletNumber,
  }) async {
    final response = await _dio.post('/payments/initiate', data: {
      'provider': provider,
      'tier': tier,
      'months': months,
      if (walletNumber != null) 'mobileWalletNumber': walletNumber,
    });
    return response.data;
  }
}
