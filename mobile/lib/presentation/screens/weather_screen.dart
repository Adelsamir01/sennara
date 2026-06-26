import 'package:flutter/material.dart';
import '../../core/l10n/app_localizations.dart';
import '../../core/utils/show_feedback.dart';
import '../widgets/sennara_card.dart';

class WeatherScreen extends StatelessWidget {
  const WeatherScreen({super.key});

  static final List<_ForecastDay> _forecast = [
    _ForecastDay('السبت', 28, 0.4, 'NW'),
    _ForecastDay('الأحد', 29, 0.5, 'N'),
    _ForecastDay('الإثنين', 30, 0.6, 'NE'),
    _ForecastDay('الثلاثاء', 27, 0.3, 'W'),
    _ForecastDay('الأربعاء', 26, 0.2, 'SW'),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final l10n = AppLocalizations.of(context);
    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.translate('weather.title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => showFeedback(context, l10n.translate('weather.updated', args: {'time': '10:23'})),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 8),
        children: [
          SennaraCard(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'الغردقة، مصر',
                      style: theme.textTheme.titleMedium?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primary,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        l10n.translate('common.today'),
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.onPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Icon(
                      Icons.water,
                      size: 56,
                      color: theme.colorScheme.primary,
                    ),
                    const SizedBox(width: 16),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '28°',
                          style: theme.textTheme.displayLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                        Text(
                          l10n.translate('weather.airTemp'),
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: theme.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.6,
                  children: [
                    MetricChip(
                      icon: Icons.air,
                      label: l10n.translate('weather.wind'),
                      value: '18 km/h NW',
                    ),
                    MetricChip(
                      icon: Icons.waves,
                      label: l10n.translate('weather.waveHeight'),
                      value: '0.45 m',
                    ),
                    MetricChip(
                      icon: Icons.thermostat,
                      label: l10n.translate('weather.waterTemp'),
                      value: '26°',
                    ),
                    MetricChip(
                      icon: Icons.visibility,
                      label: l10n.translate('weather.visibility'),
                      value: '12 km',
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  l10n.translate('weather.updated', args: {'time': '10:23'}),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
            child: Text(
              l10n.translate('weather.forecast7d'),
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
          ..._forecast.map(
            (day) => SennaraCard(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    flex: 2,
                    child: Text(
                      day.day,
                      style: theme.textTheme.bodyLarge?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  Icon(Icons.wb_sunny, color: theme.colorScheme.secondary),
                  const SizedBox(width: 8),
                  Text(
                    '${day.temp}°',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(Icons.air, size: 18, color: theme.colorScheme.outline),
                  const SizedBox(width: 4),
                  Text('${day.wind} km/h'),
                  const SizedBox(width: 16),
                  Icon(Icons.waves, size: 18, color: theme.colorScheme.outline),
                  const SizedBox(width: 4),
                  Text('${day.wave} m'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
        ],
      ),
    );
  }
}

class _ForecastDay {
  final String day;
  final int temp;
  final double wave;
  final String wind;

  _ForecastDay(this.day, this.temp, this.wave, this.wind);
}
