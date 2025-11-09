import { Post, CategoryType } from '../models/Post';
import { Summary } from '../models/Summary';
import { logger } from '../config/logger';

interface CategoryStats {
  [key: string]: {
    total: number;
    emergency: number;
    urgent: number;
    normal: number;
  };
}

export async function generateDailySummary(
  community: string,
  dateISO: string
): Promise<any> {
  try {
    // Check if summary already exists
    const existing = await Summary.findOne({ community, dateISO });
    if (existing) {
      return existing;
    }

    // Parse date for query
    const date = new Date(dateISO);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch posts for the day
    const posts = await Post.find({
      community,
      createdAt: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
      status: 'active',
    });

    if (posts.length === 0) {
      const emptySummary = await Summary.create({
        community,
        dateISO,
        summaryText: `No activity reported in ${community} on ${dateISO}.`,
        stats: {
          total: 0,
          emergency: 0,
          urgent: 0,
          normal: 0,
        },
      });
      return emptySummary;
    }

    // Calculate stats
    const stats = {
      total: posts.length,
      emergency: posts.filter(p => p.urgency === 'emergency').length,
      urgent: posts.filter(p => p.urgency === 'urgent').length,
      normal: posts.filter(p => p.urgency === 'normal').length,
    };

    // Group by category
    const categoryStats: CategoryStats = {};
    posts.forEach(post => {
      if (!categoryStats[post.category]) {
        categoryStats[post.category] = {
          total: 0,
          emergency: 0,
          urgent: 0,
          normal: 0,
        };
      }
      categoryStats[post.category].total++;
      categoryStats[post.category][post.urgency]++;
    });

    // Generate summary text (rule-based)
    const summaryText = generateSummaryText(community, dateISO, stats, categoryStats);

    // Save summary
    const summary = await Summary.create({
      community,
      dateISO,
      summaryText,
      stats,
    });

    logger.info('Daily summary generated', { community, dateISO, stats });

    return summary;
  } catch (error) {
    logger.error('Failed to generate daily summary', { error, community, dateISO });
    throw error;
  }
}

function generateSummaryText(
  community: string,
  dateISO: string,
  stats: any,
  categoryStats: CategoryStats
): string {
  const parts: string[] = [];
  const date = new Date(dateISO);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

  // Better formatted header
  parts.push(`# 📊 Daily Summary for ${community}`);
  parts.push(`**${dayName}, ${dateISO}**\n`);

  // At-a-glance overview with visual indicators
  parts.push(`## 📈 Overview`);
  const activityLevel = stats.total === 0 ? '😴 Quiet' : stats.total < 5 ? '🟢 Low' : stats.total < 20 ? '🟡 Moderate' : '🔴 High';
  parts.push(`- **Activity Level:** ${activityLevel}`);
  parts.push(`- **Total Posts:** ${stats.total}\n`);

  // Urgency breakdown with better formatting
  if (stats.emergency > 0 || stats.urgent > 0 || stats.normal > 0) {
    parts.push(`## 🎯 Urgency Breakdown`);
    if (stats.emergency > 0) {
      parts.push(`- 🚨 **Emergency:** ${stats.emergency} post${stats.emergency > 1 ? 's' : ''}`);
    }
    if (stats.urgent > 0) {
      parts.push(`- ⚠️ **Urgent:** ${stats.urgent} post${stats.urgent > 1 ? 's' : ''}`);
    }
    if (stats.normal > 0) {
      parts.push(`- ✅ **Normal:** ${stats.normal} post${stats.normal > 1 ? 's' : ''}`);
    }
    parts.push('');
  }

  // Category breakdown with icons
  if (Object.keys(categoryStats).length > 0) {
    parts.push(`## 📂 Activity by Category`);
    const sortedCategories = Object.entries(categoryStats)
      .sort(([, a], [, b]) => b.total - a.total);

    sortedCategories.forEach(([category, catStats]) => {
      const icon = getCategoryIcon(category);
      const urgencyNote = catStats.emergency > 0 
        ? ` ⚠️ (${catStats.emergency} emergency)` 
        : catStats.urgent > 0 
          ? ` ⚡ (${catStats.urgent} urgent)` 
          : '';
      parts.push(`- ${icon} **${category}:** ${catStats.total} post${catStats.total > 1 ? 's' : ''}${urgencyNote}`);
    });
    parts.push('');
  }

  // Actionable insights section
  parts.push(`## 💡 Insights & Recommendations`);
  if (stats.emergency > 0) {
    parts.push(`🚨 **URGENT:** ${stats.emergency} emergency report${stats.emergency > 1 ? 's' : ''} require${stats.emergency === 1 ? 's' : ''} immediate attention.`);
    parts.push(`\n→ *Action: Review emergency posts and coordinate response immediately.*`);
  } else if (stats.urgent > 5) {
    parts.push(`📢 **Notice:** Higher than usual urgent activity (${stats.urgent} posts).`);
    parts.push(`\n→ *Action: Monitor situation closely for potential escalation.*`);
  } else if (stats.total === 0) {
    parts.push(`😴 **All Quiet:** No community activity reported today.`);
    parts.push(`\n→ *Consider posting community updates to boost engagement.*`);
  } else {
    parts.push(`✅ **All Clear:** Community activity is within normal range.`);
    parts.push(`\n→ *Continue regular monitoring. Everything looks good!*`);
  }

  return parts.join('\n');
}

// Helper function for category icons
function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'Safety': '🚨',
    'Events': '🎉',
    'Lost & Found': '🔍',
    'Public Works': '🔧',
    'General': '💬'
  };
  return icons[category] || '📌';
}

export async function getOrCreateDailySummary(
  community: string,
  date?: string
): Promise<any> {
  const dateISO = date || new Date().toISOString().split('T')[0];
  return generateDailySummary(community, dateISO);
}

