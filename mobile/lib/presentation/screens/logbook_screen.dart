import 'package:flutter/material.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/utils/show_feedback.dart';
import '../widgets/sennara_card.dart';

class LogbookScreen extends StatelessWidget {
  const LogbookScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('logbook.title')),
      ),
      body: Column(
        children: [
          SennaraCard(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primary,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Icon(
                    Icons.menu_book,
                    color: theme.colorScheme.onPrimary,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.translate('logbook.catchesCount', args: {'count': 12}),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      Text(
                        '2026',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: EmptyState(
              message: l10n.translate('feed.empty'),
              icon: Icons.menu_book_outlined,
              action: ElevatedButton.icon(
                onPressed: () => showFeedback(context, l10n.translate('logbook.addCatch')),
                icon: const Icon(Icons.add),
                label: Text(l10n.translate('logbook.addCatch')),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        heroTag: 'logbookFab',
        onPressed: () => showFeedback(context, l10n.translate('logbook.addCatch')),
        child: const Icon(Icons.add),
      ),
    );
  }
}
