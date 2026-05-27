import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
} from "react-native";

import { COLORS }
from "../constants/theme";

export default function PrimaryButton({title, loading, onPress}) {

  return (
    <TouchableOpacity
      className="p-4 rounded-2xl items-center"
      style={{backgroundColor: COLORS.primary,}}
      onPress={onPress}
      disabled={loading}
    >
      {loading ? ( <ActivityIndicator color="white"/>) 
      : (<Text className="text-white font-bold text-lg">{title}</Text>)}
    </TouchableOpacity>

  );
}