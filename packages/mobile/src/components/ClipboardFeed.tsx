import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export interface MobileClipboardItem {
  id: string;
  text: string;
  senderName: string;
  timestamp: number;
}

interface ClipboardFeedProps {
  items: MobileClipboardItem[];
}

export const ClipboardFeed: React.FC<ClipboardFeedProps> = ({ items }) => {
  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Universal Clipboard</Text>
      {items.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No clipboard items yet.</Text>
          <Text style={styles.emptySubText}>Copy text on PC or Web to see it here instantly.</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.senderText}>{item.senderName}</Text>
                <TouchableOpacity style={styles.copyButton} onPress={() => handleCopy(item.text)}>
                  <Text style={styles.copyText}>Copy</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.itemText} numberOfLines={4}>
                {item.text}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 12,
  },
  emptyCard: {
    padding: 30,
    backgroundColor: '#0f1420',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
  },
  emptyText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  emptySubText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#0f1420',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  senderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6366f1',
  },
  copyButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  copyText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '600',
  },
  itemText: {
    color: '#f8fafc',
    fontSize: 13,
    lineHeight: 18,
  },
});
