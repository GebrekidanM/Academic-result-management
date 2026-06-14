import { View } from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <View className="bg-white border border-pink-600 rounded w-full">
      <Picker
        selectedValue={i18n.language}
        onValueChange={(value) => i18n.changeLanguage(value)}
        style={{ color: "#db2777" }}
      >
        <Picker.Item label="English" value="en" />
        <Picker.Item label="አማርኛ" value="am" />
        <Picker.Item label="Afaan Oromoo" value="om" />
        <Picker.Item label="ትግርኛ" value="ti" />
        <Picker.Item label="Soomaali" value="so" />
        <Picker.Item label="Afaraf" value="af" />
      </Picker>
    </View>
  );
}