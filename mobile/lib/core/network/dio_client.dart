import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../constants/api_constants.dart';

class DioClient {
  late final Dio _dio;

  DioClient() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: ApiConstants.connectTimeout,
        receiveTimeout: ApiConstants.receiveTimeout,
        headers: {
          'Content-Type': 'application/json',
          // Bypass the localtunnel anti-abuse warning page for API calls
          'Bypass-Tunnel-Reminder': '1',
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
        onError: (error, handler) {
          // TODO: refresh token on 401
          handler.next(error);
        },
      ),
    );
  }

  Dio get dio => _dio;
}
