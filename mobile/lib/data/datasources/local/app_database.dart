import 'dart:convert';
import 'package:drift/drift.dart';
import 'package:drift_flutter/drift_flutter.dart';
import 'package:path_provider/path_provider.dart';

part 'app_database.g.dart';

enum SyncStatus { pending, uploading, failed, completed }

class OfflineSyncItems extends Table {
  TextColumn get id => text()();
  TextColumn get entityType => text()();
  TextColumn get payload => text()();
  TextColumn get mediaPaths => text().withDefault(const Constant('[]'))();
  TextColumn get status => textEnum<SyncStatus>()();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
  TextColumn get errorLog => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

@DriftDatabase(tables: [OfflineSyncItems])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  @override
  int get schemaVersion => 1;

  static QueryExecutor _openConnection() {
    return driftDatabase(
      name: 'sennara_db',
      native: const DriftNativeOptions(databaseDirectory: getApplicationSupportDirectory),
    );
  }

  Future<int> queueItem({
    required String id,
    required String entityType,
    required Map<String, dynamic> payload,
    List<String> mediaPaths = const [],
  }) {
    return into(offlineSyncItems).insert(
      OfflineSyncItemsCompanion(
        id: Value(id),
        entityType: Value(entityType),
        payload: Value(jsonEncode(payload)),
        mediaPaths: Value(jsonEncode(mediaPaths)),
        status: const Value(SyncStatus.pending),
      ),
      mode: InsertMode.replace,
    );
  }

  Future<List<OfflineSyncItem>> getPendingItems() {
    return (select(offlineSyncItems)
          ..where((i) => i.status.equals(SyncStatus.pending.name))
          ..orderBy([(i) => OrderingTerm(expression: i.createdAt)]))
        .get();
  }

  Future<int> markCompleted(String id) {
    return (update(offlineSyncItems)..where((i) => i.id.equals(id)))
        .write(const OfflineSyncItemsCompanion(status: Value(SyncStatus.completed)));
  }

  Future<int> markFailed(String id, String error) {
    return (update(offlineSyncItems)..where((i) => i.id.equals(id))).write(
      OfflineSyncItemsCompanion(
        status: const Value(SyncStatus.failed),
        retryCount: const Value(1),
        errorLog: Value(error),
      ),
    );
  }
}
