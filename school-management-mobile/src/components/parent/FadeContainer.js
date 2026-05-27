import React, { useEffect, useRef} from "react";
import { Animated} from "react-native";

export default function FadeContainer({ children, style}) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[{opacity,}, style]}>
      {children}
    </Animated.View>
  );
}