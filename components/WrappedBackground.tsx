import { useEffect, useMemo, useRef } from 'react';
import { Animated, ImageSourcePropType, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

// Animated background for the Wrapped slides. Gives a "living" Spotify-Wrapped
// feel: a slow Ken Burns drift on the image (when provided), a roaming soft
// glow, and floating light particles. Works with just a gradient too.

function Particle({ height, seed }: { height: number; seed: number }) {
  const y = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const cfg = useMemo(() => {
    const rnd = (n: number) => ((Math.sin(seed * 9301 + n * 49297) + 1) / 2);
    return { left: rnd(1) * 100, size: 3 + rnd(2) * 5, dur: 7000 + rnd(3) * 7000, delay: rnd(4) * 6000 };
  }, [seed]);

  useEffect(() => {
    const loop = Animated.loop(Animated.parallel([
      Animated.timing(y, { toValue: 1, duration: cfg.dur, delay: cfg.delay, useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: cfg.dur * 0.3, delay: cfg.delay, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: cfg.dur * 0.7, useNativeDriver: true })
      ])
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = y.interpolate({ inputRange: [0, 1], outputRange: [0, -(height + 60)] });
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', bottom: 0, left: (cfg.left + '%') as `${number}%`, width: cfg.size, height: cfg.size, borderRadius: cfg.size, backgroundColor: 'rgba(255,255,255,0.9)', opacity, transform: [{ translateY }] }}
    />
  );
}

export function WrappedBackground({ colors, image }: { colors: readonly [string, string]; image?: ImageSourcePropType }) {
  const { width, height } = useWindowDimensions();
  const kb = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(kb, { toValue: 1, duration: 14000, useNativeDriver: true }),
      Animated.timing(kb, { toValue: 0, duration: 14000, useNativeDriver: true })
    ]));
    const b = Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 16000, useNativeDriver: true }),
      Animated.timing(glow, { toValue: 0, duration: 16000, useNativeDriver: true })
    ]));
    a.start(); b.start();
    return () => { a.stop(); b.stop(); };
  }, []);

  const scale = kb.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const kbX = kb.interpolate({ inputRange: [0, 1], outputRange: [0, -22] });
  const kbY = kb.interpolate({ inputRange: [0, 1], outputRange: [0, -18] });
  const glowX = glow.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.25, width * 0.25] });
  const glowY = glow.interpolate({ inputRange: [0, 1], outputRange: [-height * 0.12, height * 0.18] });

  return (
    <>
      <LinearGradient colors={colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      {image ? (
        <>
          <Animated.Image source={image} resizeMode="cover" style={[StyleSheet.absoluteFill, { width: '100%', height: '100%', transform: [{ scale }, { translateX: kbX }, { translateY: kbY }] }]} />
          <LinearGradient colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.38)']} style={StyleSheet.absoluteFill} />
        </>
      ) : null}
      <Animated.View pointerEvents="none" style={[styles.glow, { transform: [{ translateX: glowX }, { translateY: glowY }] }]} />
      {Array.from({ length: 14 }).map((_, i) => <Particle key={i} height={height} seed={i + 1} />)}
    </>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: -120, left: '50%', marginLeft: -210, width: 420, height: 420, borderRadius: 210, backgroundColor: 'rgba(255,255,255,0.06)' }
});
