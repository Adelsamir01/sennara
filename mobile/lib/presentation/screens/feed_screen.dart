import 'package:flutter/material.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/utils/show_feedback.dart';
import '../../data/models/catch_model.dart';
import '../widgets/sennara_card.dart';

class FeedScreen extends StatelessWidget {
  const FeedScreen({super.key});

  static final List<CatchModel> _demoCatches = [
    CatchModel(
      id: '1',
      speciesId: 'hamour',
      weightKg: 8.5,
      lengthCm: 72,
      privacy: 'public',
      latitude: 27.2579,
      longitude: 33.8116,
      description: 'هامور جميل الصبح بدري',
      catchDate: DateTime.now().subtract(const Duration(hours: 3)),
      photoUrls: const [],
    ),
    CatchModel(
      id: '2',
      speciesId: 'bolty',
      weightKg: 1.2,
      lengthCm: 28,
      privacy: 'friends_only',
      latitude: 30.0444,
      longitude: 31.2357,
      description: 'بلطي من النيل',
      catchDate: DateTime.now().subtract(const Duration(hours: 8)),
      photoUrls: const [],
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('feed.title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () => showFeedback(context, l10n.translate('common.search')),
          ),
        ],
      ),
      body: _demoCatches.isEmpty
          ? EmptyState(
              message: l10n.translate('feed.empty'),
              icon: Icons.rss_feed_outlined,
              action: ElevatedButton.icon(
                onPressed: () => showFeedback(context, l10n.translate('logbook.addCatch')),
                icon: const Icon(Icons.add),
                label: Text(l10n.translate('logbook.addCatch')),
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.symmetric(vertical: 8),
              itemCount: _demoCatches.length,
              itemBuilder: (context, index) {
                final catchItem = _demoCatches[index];
                return CatchCard(catchItem: catchItem);
              },
            ),
      floatingActionButton: FloatingActionButton.extended(
        heroTag: 'feedFab',
        onPressed: () => showFeedback(context, l10n.translate('logbook.addCatch')),
        icon: const Icon(Icons.add),
        label: Text(l10n.translate('logbook.addCatch')),
      ),
    );
  }
}

class CatchCard extends StatelessWidget {
  const CatchCard({super.key, required this.catchItem});

  final CatchModel catchItem;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);

    return SennaraCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                backgroundColor: theme.colorScheme.primaryContainer,
                child: Icon(
                  Icons.person,
                  color: theme.colorScheme.onPrimaryContainer,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'صياد ${catchItem.id}',
                      style: theme.textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    Text(
                      _timeAgo(context, catchItem.catchDate),
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
              _PrivacyBadge(privacy: catchItem.privacy),
            ],
          ),
          if (catchItem.description != null &&
              catchItem.description!.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(
              catchItem.description!,
              style: theme.textTheme.bodyMedium,
            ),
          ],
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              if (catchItem.weightKg != null)
                _InfoChip(
                  icon: Icons.scale_outlined,
                  text: l10n.translate('common.kg', args: {'value': catchItem.weightKg.toString()}),
                ),
              if (catchItem.lengthCm != null)
                _InfoChip(
                  icon: Icons.straighten_outlined,
                  text: l10n.translate('common.cm', args: {'value': catchItem.lengthCm.toString()}),
                ),
              _InfoChip(
                icon: Icons.location_on_outlined,
                text: '${catchItem.latitude.toStringAsFixed(2)}, '
                    '${catchItem.longitude.toStringAsFixed(2)}',
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              _ActionButton(
                icon: Icons.thumb_up_alt_outlined,
                label: l10n.translate('feed.niceCatch'),
                onTap: () => showFeedback(context, l10n.translate('feed.niceCatch')),
              ),
              const SizedBox(width: 16),
              _ActionButton(
                icon: Icons.comment_outlined,
                label: l10n.translate('feed.comment'),
                onTap: () => showFeedback(context, l10n.translate('feed.comment')),
              ),
              const SizedBox(width: 16),
              _ActionButton(
                icon: Icons.share_outlined,
                label: l10n.translate('feed.share'),
                onTap: () => showFeedback(context, l10n.translate('feed.share')),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _timeAgo(BuildContext context, DateTime? date) {
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) return 'منذ ${diff.inMinutes} د';
    if (diff.inHours < 24) return 'منذ ${diff.inHours} س';
    return 'منذ ${diff.inDays} ي';
  }
}

class _PrivacyBadge extends StatelessWidget {
  const _PrivacyBadge({required this.privacy});

  final String privacy;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    final label = switch (privacy) {
      'public' => l10n.translate('map.privacyPublic'),
      'friends_only' => l10n.translate('map.privacyFriends'),
      _ => l10n.translate('map.privacySecret'),
    };
    final color = switch (privacy) {
      'public' => theme.colorScheme.tertiary,
      'friends_only' => theme.colorScheme.secondary,
      _ => theme.colorScheme.outline,
    };
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(
        label,
        style: theme.textTheme.labelSmall?.copyWith(
          color: color,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  const _InfoChip({required this.icon, required this.text});

  final IconData icon;
  final String? text;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Chip(
      avatar: Icon(icon, size: 16, color: theme.colorScheme.primary),
      label: Text(
        text ?? '-',
        style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
      ),
      visualDensity: VisualDensity.compact,
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(8),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(width: 6),
            Text(
              label,
              style: theme.textTheme.labelLarge?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
