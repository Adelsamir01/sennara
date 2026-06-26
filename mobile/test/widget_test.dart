import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sennara/presentation/screens/home_screen.dart';

void main() {
  testWidgets('Home screen shows bottom navigation', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: HomeScreen(),
      ),
    );

    expect(find.byType(HomeScreen), findsOneWidget);
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
