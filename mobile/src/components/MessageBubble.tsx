import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/theme/colors';
import type { Message } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface Props {
  message: Message;
  isOwn: boolean;
}

export default function MessageBubble({ message, isOwn }: Props) {
  const time = (() => {
    try {
      return format(parseISO(message.createdAt), 'h:mm a');
    } catch {
      return '';
    }
  })();

  return (
    <View style={[styles.container, isOwn ? styles.containerOwn : styles.containerOther]}>
      <View style={[styles.bubble, isOwn ? styles.bubbleOwn : styles.bubbleOther]}>
        <Text style={[styles.text, isOwn ? styles.textOwn : styles.textOther]}>
          {message.message}
        </Text>
      </View>
      <Text style={[styles.time, isOwn ? styles.timeOwn : styles.timeOther]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 3,
    maxWidth: '80%',
  },
  containerOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  containerOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  bubbleOwn: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: Colors.surfaceSecondary,
    borderBottomLeftRadius: 4,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  textOwn: {
    color: '#FFFFFF',
  },
  textOther: {
    color: Colors.text,
  },
  time: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: 3,
    marginHorizontal: 4,
  },
  timeOwn: {
    textAlign: 'right',
  },
  timeOther: {
    textAlign: 'left',
  },
});
