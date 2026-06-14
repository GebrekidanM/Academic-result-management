import React from "react";
import { View } from "react-native";

const Skeleton = ({className = ""}) => {
  return (
    <View
      className={`
        bg-slate-200
        rounded-xl
        ${className}
      `}
    />
  );
};

export default Skeleton;