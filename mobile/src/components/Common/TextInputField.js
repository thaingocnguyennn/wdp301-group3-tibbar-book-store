import React, { useState } from "react";
import { View, TextInput, StyleSheet, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { theme } from "../../constants/theme";

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: theme.colors.textPrimary,
    marginBottom: 7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    backgroundColor: theme.colors.surface,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: theme.colors.textPrimary,
  },
  icon: {
    marginRight: 8,
  },
  errorText: {
    color: theme.colors.danger,
    fontSize: 12,
    marginTop: 4,
  },
});

export const TextInputField = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  error,
  icon,
  editable = true,
  multiline = false,
  numberOfLines = 1,
}) => {
  const [isSecure, setIsSecure] = useState(secureTextEntry);
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.inputContainer}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color={theme.colors.textSecondary}
            style={styles.icon}
          />
        )}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={isSecure}
          keyboardType={keyboardType}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
          placeholderTextColor="#94a3b8"
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setIsSecure(!isSecure)}>
            <MaterialIcons
              name={isSecure ? "visibility-off" : "visibility"}
              size={20}
              color={theme.colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};
