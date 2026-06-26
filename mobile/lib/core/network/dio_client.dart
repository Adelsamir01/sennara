import 'dart:async';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class DioClient {
  late final Dio _dio;
  bool _isRefreshing = false;
  final List<Completer<bool>> _refreshQueue = [];

  DioClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'SennaraMobile/1.0',
        },
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('accessToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          options.headers['X-Locale'] = prefs.getString('locale') ?? 'ar';
          handler.next(options);
        },
        onError: (error, handler) async {
          final requestOptions = error.requestOptions;
          if (error.response?.statusCode == 401 &&
              requestOptions.path != '/auth/refresh' &&
              requestOptions.path != '/auth/otp/request' &&
              requestOptions.path != '/auth/otp/verify') {
            final shouldRetry = await _handle401();
            if (shouldRetry) {
              final response = await _retry(requestOptions);
              return handler.resolve(response);
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  Future<bool> _handle401() async {
    if (_isRefreshing) {
      final completer = Completer<bool>();
      _refreshQueue.add(completer);
      return completer.future;
    }

    _isRefreshing = true;
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refreshToken');
    if (refreshToken == null || refreshToken.isEmpty) {
      await _clearAuth();
      _releaseQueue(false);
      return false;
    }

    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refreshToken': refreshToken},
        options: Options(headers: {'Authorization': null}),
      );
      final tokens = response.data['tokens'] as Map<String, dynamic>?;
      if (tokens == null) throw Exception('No tokens returned');

      await prefs.setString('accessToken', tokens['accessToken'] as String);
      await prefs.setString('refreshToken', tokens['refreshToken'] as String);
      _releaseQueue(true);
      return true;
    } catch (e) {
      await _clearAuth();
      _releaseQueue(false);
      return false;
    } finally {
      _isRefreshing = false;
    }
  }

  void _releaseQueue(bool success) {
    for (final completer in _refreshQueue) {
      completer.complete(success);
    }
    _refreshQueue.clear();
  }

  Future<void> _clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
  }

  Future<Response<dynamic>> _retry(RequestOptions requestOptions) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    final options = Options(
      method: requestOptions.method,
      headers: {
        ...requestOptions.headers,
        if (token != null) 'Authorization': 'Bearer $token',
      },
    );
    return _dio.request<dynamic>(
      requestOptions.path,
      data: requestOptions.data,
      queryParameters: requestOptions.queryParameters,
      options: options,
    );
  }

  Dio get dio => _dio;
}
