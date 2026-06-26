// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'app_database.dart';

// ignore_for_file: type=lint
class $OfflineSyncItemsTable extends OfflineSyncItems
    with TableInfo<$OfflineSyncItemsTable, OfflineSyncItem> {
  @override
  final GeneratedDatabase attachedDatabase;
  final String? _alias;
  $OfflineSyncItemsTable(this.attachedDatabase, [this._alias]);
  static const VerificationMeta _idMeta = const VerificationMeta('id');
  @override
  late final GeneratedColumn<String> id = GeneratedColumn<String>(
      'id', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _entityTypeMeta =
      const VerificationMeta('entityType');
  @override
  late final GeneratedColumn<String> entityType = GeneratedColumn<String>(
      'entity_type', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _payloadMeta =
      const VerificationMeta('payload');
  @override
  late final GeneratedColumn<String> payload = GeneratedColumn<String>(
      'payload', aliasedName, false,
      type: DriftSqlType.string, requiredDuringInsert: true);
  static const VerificationMeta _mediaPathsMeta =
      const VerificationMeta('mediaPaths');
  @override
  late final GeneratedColumn<String> mediaPaths = GeneratedColumn<String>(
      'media_paths', aliasedName, false,
      type: DriftSqlType.string,
      requiredDuringInsert: false,
      defaultValue: const Constant('[]'));
  @override
  late final GeneratedColumnWithTypeConverter<SyncStatus, String> status =
      GeneratedColumn<String>('status', aliasedName, false,
              type: DriftSqlType.string, requiredDuringInsert: true)
          .withConverter<SyncStatus>($OfflineSyncItemsTable.$converterstatus);
  static const VerificationMeta _retryCountMeta =
      const VerificationMeta('retryCount');
  @override
  late final GeneratedColumn<int> retryCount = GeneratedColumn<int>(
      'retry_count', aliasedName, false,
      type: DriftSqlType.int,
      requiredDuringInsert: false,
      defaultValue: const Constant(0));
  static const VerificationMeta _errorLogMeta =
      const VerificationMeta('errorLog');
  @override
  late final GeneratedColumn<String> errorLog = GeneratedColumn<String>(
      'error_log', aliasedName, true,
      type: DriftSqlType.string, requiredDuringInsert: false);
  static const VerificationMeta _createdAtMeta =
      const VerificationMeta('createdAt');
  @override
  late final GeneratedColumn<DateTime> createdAt = GeneratedColumn<DateTime>(
      'created_at', aliasedName, false,
      type: DriftSqlType.dateTime,
      requiredDuringInsert: false,
      defaultValue: currentDateAndTime);
  @override
  List<GeneratedColumn> get $columns => [
        id,
        entityType,
        payload,
        mediaPaths,
        status,
        retryCount,
        errorLog,
        createdAt
      ];
  @override
  String get aliasedName => _alias ?? actualTableName;
  @override
  String get actualTableName => $name;
  static const String $name = 'offline_sync_items';
  @override
  VerificationContext validateIntegrity(Insertable<OfflineSyncItem> instance,
      {bool isInserting = false}) {
    final context = VerificationContext();
    final data = instance.toColumns(true);
    if (data.containsKey('id')) {
      context.handle(_idMeta, id.isAcceptableOrUnknown(data['id']!, _idMeta));
    } else if (isInserting) {
      context.missing(_idMeta);
    }
    if (data.containsKey('entity_type')) {
      context.handle(
          _entityTypeMeta,
          entityType.isAcceptableOrUnknown(
              data['entity_type']!, _entityTypeMeta));
    } else if (isInserting) {
      context.missing(_entityTypeMeta);
    }
    if (data.containsKey('payload')) {
      context.handle(_payloadMeta,
          payload.isAcceptableOrUnknown(data['payload']!, _payloadMeta));
    } else if (isInserting) {
      context.missing(_payloadMeta);
    }
    if (data.containsKey('media_paths')) {
      context.handle(
          _mediaPathsMeta,
          mediaPaths.isAcceptableOrUnknown(
              data['media_paths']!, _mediaPathsMeta));
    }
    if (data.containsKey('retry_count')) {
      context.handle(
          _retryCountMeta,
          retryCount.isAcceptableOrUnknown(
              data['retry_count']!, _retryCountMeta));
    }
    if (data.containsKey('error_log')) {
      context.handle(_errorLogMeta,
          errorLog.isAcceptableOrUnknown(data['error_log']!, _errorLogMeta));
    }
    if (data.containsKey('created_at')) {
      context.handle(_createdAtMeta,
          createdAt.isAcceptableOrUnknown(data['created_at']!, _createdAtMeta));
    }
    return context;
  }

  @override
  Set<GeneratedColumn> get $primaryKey => {id};
  @override
  OfflineSyncItem map(Map<String, dynamic> data, {String? tablePrefix}) {
    final effectivePrefix = tablePrefix != null ? '$tablePrefix.' : '';
    return OfflineSyncItem(
      id: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}id'])!,
      entityType: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}entity_type'])!,
      payload: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}payload'])!,
      mediaPaths: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}media_paths'])!,
      status: $OfflineSyncItemsTable.$converterstatus.fromSql(attachedDatabase
          .typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}status'])!),
      retryCount: attachedDatabase.typeMapping
          .read(DriftSqlType.int, data['${effectivePrefix}retry_count'])!,
      errorLog: attachedDatabase.typeMapping
          .read(DriftSqlType.string, data['${effectivePrefix}error_log']),
      createdAt: attachedDatabase.typeMapping
          .read(DriftSqlType.dateTime, data['${effectivePrefix}created_at'])!,
    );
  }

  @override
  $OfflineSyncItemsTable createAlias(String alias) {
    return $OfflineSyncItemsTable(attachedDatabase, alias);
  }

  static JsonTypeConverter2<SyncStatus, String, String> $converterstatus =
      const EnumNameConverter<SyncStatus>(SyncStatus.values);
}

class OfflineSyncItem extends DataClass implements Insertable<OfflineSyncItem> {
  final String id;
  final String entityType;
  final String payload;
  final String mediaPaths;
  final SyncStatus status;
  final int retryCount;
  final String? errorLog;
  final DateTime createdAt;
  const OfflineSyncItem(
      {required this.id,
      required this.entityType,
      required this.payload,
      required this.mediaPaths,
      required this.status,
      required this.retryCount,
      this.errorLog,
      required this.createdAt});
  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    map['id'] = Variable<String>(id);
    map['entity_type'] = Variable<String>(entityType);
    map['payload'] = Variable<String>(payload);
    map['media_paths'] = Variable<String>(mediaPaths);
    {
      map['status'] = Variable<String>(
          $OfflineSyncItemsTable.$converterstatus.toSql(status));
    }
    map['retry_count'] = Variable<int>(retryCount);
    if (!nullToAbsent || errorLog != null) {
      map['error_log'] = Variable<String>(errorLog);
    }
    map['created_at'] = Variable<DateTime>(createdAt);
    return map;
  }

  OfflineSyncItemsCompanion toCompanion(bool nullToAbsent) {
    return OfflineSyncItemsCompanion(
      id: Value(id),
      entityType: Value(entityType),
      payload: Value(payload),
      mediaPaths: Value(mediaPaths),
      status: Value(status),
      retryCount: Value(retryCount),
      errorLog: errorLog == null && nullToAbsent
          ? const Value.absent()
          : Value(errorLog),
      createdAt: Value(createdAt),
    );
  }

  factory OfflineSyncItem.fromJson(Map<String, dynamic> json,
      {ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return OfflineSyncItem(
      id: serializer.fromJson<String>(json['id']),
      entityType: serializer.fromJson<String>(json['entityType']),
      payload: serializer.fromJson<String>(json['payload']),
      mediaPaths: serializer.fromJson<String>(json['mediaPaths']),
      status: $OfflineSyncItemsTable.$converterstatus
          .fromJson(serializer.fromJson<String>(json['status'])),
      retryCount: serializer.fromJson<int>(json['retryCount']),
      errorLog: serializer.fromJson<String?>(json['errorLog']),
      createdAt: serializer.fromJson<DateTime>(json['createdAt']),
    );
  }
  @override
  Map<String, dynamic> toJson({ValueSerializer? serializer}) {
    serializer ??= driftRuntimeOptions.defaultSerializer;
    return <String, dynamic>{
      'id': serializer.toJson<String>(id),
      'entityType': serializer.toJson<String>(entityType),
      'payload': serializer.toJson<String>(payload),
      'mediaPaths': serializer.toJson<String>(mediaPaths),
      'status': serializer.toJson<String>(
          $OfflineSyncItemsTable.$converterstatus.toJson(status)),
      'retryCount': serializer.toJson<int>(retryCount),
      'errorLog': serializer.toJson<String?>(errorLog),
      'createdAt': serializer.toJson<DateTime>(createdAt),
    };
  }

  OfflineSyncItem copyWith(
          {String? id,
          String? entityType,
          String? payload,
          String? mediaPaths,
          SyncStatus? status,
          int? retryCount,
          Value<String?> errorLog = const Value.absent(),
          DateTime? createdAt}) =>
      OfflineSyncItem(
        id: id ?? this.id,
        entityType: entityType ?? this.entityType,
        payload: payload ?? this.payload,
        mediaPaths: mediaPaths ?? this.mediaPaths,
        status: status ?? this.status,
        retryCount: retryCount ?? this.retryCount,
        errorLog: errorLog.present ? errorLog.value : this.errorLog,
        createdAt: createdAt ?? this.createdAt,
      );
  OfflineSyncItem copyWithCompanion(OfflineSyncItemsCompanion data) {
    return OfflineSyncItem(
      id: data.id.present ? data.id.value : this.id,
      entityType:
          data.entityType.present ? data.entityType.value : this.entityType,
      payload: data.payload.present ? data.payload.value : this.payload,
      mediaPaths:
          data.mediaPaths.present ? data.mediaPaths.value : this.mediaPaths,
      status: data.status.present ? data.status.value : this.status,
      retryCount:
          data.retryCount.present ? data.retryCount.value : this.retryCount,
      errorLog: data.errorLog.present ? data.errorLog.value : this.errorLog,
      createdAt: data.createdAt.present ? data.createdAt.value : this.createdAt,
    );
  }

  @override
  String toString() {
    return (StringBuffer('OfflineSyncItem(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('payload: $payload, ')
          ..write('mediaPaths: $mediaPaths, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('errorLog: $errorLog, ')
          ..write('createdAt: $createdAt')
          ..write(')'))
        .toString();
  }

  @override
  int get hashCode => Object.hash(id, entityType, payload, mediaPaths, status,
      retryCount, errorLog, createdAt);
  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      (other is OfflineSyncItem &&
          other.id == this.id &&
          other.entityType == this.entityType &&
          other.payload == this.payload &&
          other.mediaPaths == this.mediaPaths &&
          other.status == this.status &&
          other.retryCount == this.retryCount &&
          other.errorLog == this.errorLog &&
          other.createdAt == this.createdAt);
}

class OfflineSyncItemsCompanion extends UpdateCompanion<OfflineSyncItem> {
  final Value<String> id;
  final Value<String> entityType;
  final Value<String> payload;
  final Value<String> mediaPaths;
  final Value<SyncStatus> status;
  final Value<int> retryCount;
  final Value<String?> errorLog;
  final Value<DateTime> createdAt;
  final Value<int> rowid;
  const OfflineSyncItemsCompanion({
    this.id = const Value.absent(),
    this.entityType = const Value.absent(),
    this.payload = const Value.absent(),
    this.mediaPaths = const Value.absent(),
    this.status = const Value.absent(),
    this.retryCount = const Value.absent(),
    this.errorLog = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  });
  OfflineSyncItemsCompanion.insert({
    required String id,
    required String entityType,
    required String payload,
    this.mediaPaths = const Value.absent(),
    required SyncStatus status,
    this.retryCount = const Value.absent(),
    this.errorLog = const Value.absent(),
    this.createdAt = const Value.absent(),
    this.rowid = const Value.absent(),
  })  : id = Value(id),
        entityType = Value(entityType),
        payload = Value(payload),
        status = Value(status);
  static Insertable<OfflineSyncItem> custom({
    Expression<String>? id,
    Expression<String>? entityType,
    Expression<String>? payload,
    Expression<String>? mediaPaths,
    Expression<String>? status,
    Expression<int>? retryCount,
    Expression<String>? errorLog,
    Expression<DateTime>? createdAt,
    Expression<int>? rowid,
  }) {
    return RawValuesInsertable({
      if (id != null) 'id': id,
      if (entityType != null) 'entity_type': entityType,
      if (payload != null) 'payload': payload,
      if (mediaPaths != null) 'media_paths': mediaPaths,
      if (status != null) 'status': status,
      if (retryCount != null) 'retry_count': retryCount,
      if (errorLog != null) 'error_log': errorLog,
      if (createdAt != null) 'created_at': createdAt,
      if (rowid != null) 'rowid': rowid,
    });
  }

  OfflineSyncItemsCompanion copyWith(
      {Value<String>? id,
      Value<String>? entityType,
      Value<String>? payload,
      Value<String>? mediaPaths,
      Value<SyncStatus>? status,
      Value<int>? retryCount,
      Value<String?>? errorLog,
      Value<DateTime>? createdAt,
      Value<int>? rowid}) {
    return OfflineSyncItemsCompanion(
      id: id ?? this.id,
      entityType: entityType ?? this.entityType,
      payload: payload ?? this.payload,
      mediaPaths: mediaPaths ?? this.mediaPaths,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      errorLog: errorLog ?? this.errorLog,
      createdAt: createdAt ?? this.createdAt,
      rowid: rowid ?? this.rowid,
    );
  }

  @override
  Map<String, Expression> toColumns(bool nullToAbsent) {
    final map = <String, Expression>{};
    if (id.present) {
      map['id'] = Variable<String>(id.value);
    }
    if (entityType.present) {
      map['entity_type'] = Variable<String>(entityType.value);
    }
    if (payload.present) {
      map['payload'] = Variable<String>(payload.value);
    }
    if (mediaPaths.present) {
      map['media_paths'] = Variable<String>(mediaPaths.value);
    }
    if (status.present) {
      map['status'] = Variable<String>(
          $OfflineSyncItemsTable.$converterstatus.toSql(status.value));
    }
    if (retryCount.present) {
      map['retry_count'] = Variable<int>(retryCount.value);
    }
    if (errorLog.present) {
      map['error_log'] = Variable<String>(errorLog.value);
    }
    if (createdAt.present) {
      map['created_at'] = Variable<DateTime>(createdAt.value);
    }
    if (rowid.present) {
      map['rowid'] = Variable<int>(rowid.value);
    }
    return map;
  }

  @override
  String toString() {
    return (StringBuffer('OfflineSyncItemsCompanion(')
          ..write('id: $id, ')
          ..write('entityType: $entityType, ')
          ..write('payload: $payload, ')
          ..write('mediaPaths: $mediaPaths, ')
          ..write('status: $status, ')
          ..write('retryCount: $retryCount, ')
          ..write('errorLog: $errorLog, ')
          ..write('createdAt: $createdAt, ')
          ..write('rowid: $rowid')
          ..write(')'))
        .toString();
  }
}

abstract class _$AppDatabase extends GeneratedDatabase {
  _$AppDatabase(QueryExecutor e) : super(e);
  $AppDatabaseManager get managers => $AppDatabaseManager(this);
  late final $OfflineSyncItemsTable offlineSyncItems =
      $OfflineSyncItemsTable(this);
  @override
  Iterable<TableInfo<Table, Object?>> get allTables =>
      allSchemaEntities.whereType<TableInfo<Table, Object?>>();
  @override
  List<DatabaseSchemaEntity> get allSchemaEntities => [offlineSyncItems];
}

typedef $$OfflineSyncItemsTableCreateCompanionBuilder
    = OfflineSyncItemsCompanion Function({
  required String id,
  required String entityType,
  required String payload,
  Value<String> mediaPaths,
  required SyncStatus status,
  Value<int> retryCount,
  Value<String?> errorLog,
  Value<DateTime> createdAt,
  Value<int> rowid,
});
typedef $$OfflineSyncItemsTableUpdateCompanionBuilder
    = OfflineSyncItemsCompanion Function({
  Value<String> id,
  Value<String> entityType,
  Value<String> payload,
  Value<String> mediaPaths,
  Value<SyncStatus> status,
  Value<int> retryCount,
  Value<String?> errorLog,
  Value<DateTime> createdAt,
  Value<int> rowid,
});

class $$OfflineSyncItemsTableFilterComposer
    extends Composer<_$AppDatabase, $OfflineSyncItemsTable> {
  $$OfflineSyncItemsTableFilterComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnFilters<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get mediaPaths => $composableBuilder(
      column: $table.mediaPaths, builder: (column) => ColumnFilters(column));

  ColumnWithTypeConverterFilters<SyncStatus, SyncStatus, String> get status =>
      $composableBuilder(
          column: $table.status,
          builder: (column) => ColumnWithTypeConverterFilters(column));

  ColumnFilters<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnFilters(column));

  ColumnFilters<String> get errorLog => $composableBuilder(
      column: $table.errorLog, builder: (column) => ColumnFilters(column));

  ColumnFilters<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnFilters(column));
}

class $$OfflineSyncItemsTableOrderingComposer
    extends Composer<_$AppDatabase, $OfflineSyncItemsTable> {
  $$OfflineSyncItemsTableOrderingComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  ColumnOrderings<String> get id => $composableBuilder(
      column: $table.id, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get payload => $composableBuilder(
      column: $table.payload, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get mediaPaths => $composableBuilder(
      column: $table.mediaPaths, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get status => $composableBuilder(
      column: $table.status, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<String> get errorLog => $composableBuilder(
      column: $table.errorLog, builder: (column) => ColumnOrderings(column));

  ColumnOrderings<DateTime> get createdAt => $composableBuilder(
      column: $table.createdAt, builder: (column) => ColumnOrderings(column));
}

class $$OfflineSyncItemsTableAnnotationComposer
    extends Composer<_$AppDatabase, $OfflineSyncItemsTable> {
  $$OfflineSyncItemsTableAnnotationComposer({
    required super.$db,
    required super.$table,
    super.joinBuilder,
    super.$addJoinBuilderToRootComposer,
    super.$removeJoinBuilderFromRootComposer,
  });
  GeneratedColumn<String> get id =>
      $composableBuilder(column: $table.id, builder: (column) => column);

  GeneratedColumn<String> get entityType => $composableBuilder(
      column: $table.entityType, builder: (column) => column);

  GeneratedColumn<String> get payload =>
      $composableBuilder(column: $table.payload, builder: (column) => column);

  GeneratedColumn<String> get mediaPaths => $composableBuilder(
      column: $table.mediaPaths, builder: (column) => column);

  GeneratedColumnWithTypeConverter<SyncStatus, String> get status =>
      $composableBuilder(column: $table.status, builder: (column) => column);

  GeneratedColumn<int> get retryCount => $composableBuilder(
      column: $table.retryCount, builder: (column) => column);

  GeneratedColumn<String> get errorLog =>
      $composableBuilder(column: $table.errorLog, builder: (column) => column);

  GeneratedColumn<DateTime> get createdAt =>
      $composableBuilder(column: $table.createdAt, builder: (column) => column);
}

class $$OfflineSyncItemsTableTableManager extends RootTableManager<
    _$AppDatabase,
    $OfflineSyncItemsTable,
    OfflineSyncItem,
    $$OfflineSyncItemsTableFilterComposer,
    $$OfflineSyncItemsTableOrderingComposer,
    $$OfflineSyncItemsTableAnnotationComposer,
    $$OfflineSyncItemsTableCreateCompanionBuilder,
    $$OfflineSyncItemsTableUpdateCompanionBuilder,
    (
      OfflineSyncItem,
      BaseReferences<_$AppDatabase, $OfflineSyncItemsTable, OfflineSyncItem>
    ),
    OfflineSyncItem,
    PrefetchHooks Function()> {
  $$OfflineSyncItemsTableTableManager(
      _$AppDatabase db, $OfflineSyncItemsTable table)
      : super(TableManagerState(
          db: db,
          table: table,
          createFilteringComposer: () =>
              $$OfflineSyncItemsTableFilterComposer($db: db, $table: table),
          createOrderingComposer: () =>
              $$OfflineSyncItemsTableOrderingComposer($db: db, $table: table),
          createComputedFieldComposer: () =>
              $$OfflineSyncItemsTableAnnotationComposer($db: db, $table: table),
          updateCompanionCallback: ({
            Value<String> id = const Value.absent(),
            Value<String> entityType = const Value.absent(),
            Value<String> payload = const Value.absent(),
            Value<String> mediaPaths = const Value.absent(),
            Value<SyncStatus> status = const Value.absent(),
            Value<int> retryCount = const Value.absent(),
            Value<String?> errorLog = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              OfflineSyncItemsCompanion(
            id: id,
            entityType: entityType,
            payload: payload,
            mediaPaths: mediaPaths,
            status: status,
            retryCount: retryCount,
            errorLog: errorLog,
            createdAt: createdAt,
            rowid: rowid,
          ),
          createCompanionCallback: ({
            required String id,
            required String entityType,
            required String payload,
            Value<String> mediaPaths = const Value.absent(),
            required SyncStatus status,
            Value<int> retryCount = const Value.absent(),
            Value<String?> errorLog = const Value.absent(),
            Value<DateTime> createdAt = const Value.absent(),
            Value<int> rowid = const Value.absent(),
          }) =>
              OfflineSyncItemsCompanion.insert(
            id: id,
            entityType: entityType,
            payload: payload,
            mediaPaths: mediaPaths,
            status: status,
            retryCount: retryCount,
            errorLog: errorLog,
            createdAt: createdAt,
            rowid: rowid,
          ),
          withReferenceMapper: (p0) => p0
              .map((e) => (e.readTable(table), BaseReferences(db, table, e)))
              .toList(),
          prefetchHooksCallback: null,
        ));
}

typedef $$OfflineSyncItemsTableProcessedTableManager = ProcessedTableManager<
    _$AppDatabase,
    $OfflineSyncItemsTable,
    OfflineSyncItem,
    $$OfflineSyncItemsTableFilterComposer,
    $$OfflineSyncItemsTableOrderingComposer,
    $$OfflineSyncItemsTableAnnotationComposer,
    $$OfflineSyncItemsTableCreateCompanionBuilder,
    $$OfflineSyncItemsTableUpdateCompanionBuilder,
    (
      OfflineSyncItem,
      BaseReferences<_$AppDatabase, $OfflineSyncItemsTable, OfflineSyncItem>
    ),
    OfflineSyncItem,
    PrefetchHooks Function()>;

class $AppDatabaseManager {
  final _$AppDatabase _db;
  $AppDatabaseManager(this._db);
  $$OfflineSyncItemsTableTableManager get offlineSyncItems =>
      $$OfflineSyncItemsTableTableManager(_db, _db.offlineSyncItems);
}
