import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:sennara/main.dart';

void main() {
  testWidgets('Bottom nav switches tabs', (WidgetTester tester) async {
    await tester.pumpWidget(const SennaraApp());

    // Wait for splash-screen auto-navigation (2.2s animation + settle).
    await tester.pumpAndSettle(const Duration(seconds: 3));

    expect(find.byType(NavigationBar), findsOneWidget);

    // Tap the Weather tab.
    await tester.tap(find.byIcon(Icons.wb_sunny_outlined));
    await tester.pumpAndSettle();

    // Tap the Logbook tab.
    await tester.tap(find.byIcon(Icons.menu_book_outlined));
    await tester.pumpAndSettle();

    // Tap the Profile tab.
    await tester.tap(find.byIcon(Icons.person_outline));
    await tester.pumpAndSettle();

    // Tap back to Feed tab.
    await tester.tap(find.byIcon(Icons.rss_feed_outlined));
    await tester.pumpAndSettle();

    // If we got here without exceptions the nav is tappable.
    expect(find.byType(NavigationBar), findsOneWidget);
  });
}
