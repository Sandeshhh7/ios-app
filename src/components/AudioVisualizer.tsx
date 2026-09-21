import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';

interface AudioVisualizerProps {
  isPlaying: boolean;
  barCount?: number;
  isLossless?: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  isPlaying,
  barCount = 18,
  isLossless = false,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 4)
  );

  useEffect(() => {
    if (!isPlaying) {
      setHeights(Array.from({ length: barCount }, () => 4));
      return;
    }

    const interval = setInterval(() => {
      setHeights(
        Array.from({ length: barCount }, (_, i) => {
          // Dynamic harmonic motion for natural audio spectrum look
          const baseHeight = 6;
          const peakFactor = Math.sin((Date.now() / 150) + (i * 0.45));
          const noiseFactor = Math.random() * 0.4;
          const normalized = Math.max(0.15, Math.min(1, Math.abs(peakFactor) * 0.8 + noiseFactor));
          return Math.round(baseHeight + normalized * 32);
        })
      );
    }, 90);

    return () => clearInterval(interval);
  }, [isPlaying, barCount]);

  return (
    <View style={styles.container}>
      {heights.map((height, index) => {
        const activeColor = isLossless
          ? (index % 3 === 0 ? '#F59E0B' : '#60A5FA')
          : '#38BDF8';

        return (
          <View
            key={index}
            style={[
              styles.bar,
              {
                height,
                backgroundColor: isPlaying ? activeColor : 'rgba(255, 255, 255, 0.2)',
              },
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    gap: 3.5,
    marginVertical: 12,
  },
  bar: {
    width: 3.5,
    borderRadius: 2,
    minHeight: 4,
  },
});
