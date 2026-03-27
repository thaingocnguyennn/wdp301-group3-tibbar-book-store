import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../../context/AuthContext";
import { TextInputField } from "../../components/Common/TextInputField";
import { Button } from "../../components/Common/Button";
import { theme } from "../../constants/theme";

const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const NAME_REGEX = /^[\p{L}\s'-]{1,50}$/u;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleRegister = async () => {
    setError("");

    const { firstName, lastName, email, password, confirmPassword } = formData;

    if (!NAME_REGEX.test(firstName.trim())) {
      setError("First name is invalid");
      return;
    }

    if (!NAME_REGEX.test(lastName.trim())) {
      setError("Last name is invalid");
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      setError("Invalid email");
      return;
    }

    if (!PASSWORD_REGEX.test(password)) {
      setError("Password must contain letters & numbers (min 6 chars)");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const { confirmPassword, ...payload } = formData;
      await register(payload);
    } catch (err) {
      setError(err?.message || "Register failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          {/* First Name */}
          <TextInputField
            label="First Name"
            value={formData.firstName}
            onChangeText={(v) => handleChange("firstName", v)}
            placeholder="Enter first name"
            icon="person"
          />

          {/* Last Name */}
          <TextInputField
            label="Last Name"
            value={formData.lastName}
            onChangeText={(v) => handleChange("lastName", v)}
            placeholder="Enter last name"
            icon="person"
          />

          {/* Email */}
          <TextInputField
            label="Email"
            value={formData.email}
            onChangeText={(v) => handleChange("email", v)}
            keyboardType="email-address"
            placeholder="Enter email"
            icon="email"
          />

          {/* Password */}
          <TextInputField
            label="Password"
            value={formData.password}
            onChangeText={(v) => handleChange("password", v)}
            secureTextEntry={!showPassword}
            placeholder="Password (letters + numbers)"
            icon="lock"
            rightText={showPassword ? "Hide" : "Show"}
            onRightPress={() => setShowPassword((prev) => !prev)}
          />

          {/* Confirm Password */}
          <TextInputField
            label="Confirm Password"
            value={formData.confirmPassword}
            onChangeText={(v) => handleChange("confirmPassword", v)}
            secureTextEntry={!showConfirmPassword}
            placeholder="Confirm password"
            icon="lock"
            rightText={showConfirmPassword ? "Hide" : "Show"}
            onRightPress={() => setShowConfirmPassword((prev) => !prev)}
          />

          <Button
            title={loading ? "Creating Account..." : "Register"}
            onPress={handleRegister}
            loading={loading}
            style={{ marginTop: 12 }}
          />

          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.linkButton}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center", // ⭐ QUAN TRỌNG
    padding: 20,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: theme.colors.textPrimary,
    textAlign: "center",
    marginBottom: 16,
  },
  error: {
    backgroundColor: "#ffe6e6",
    color: "#e74c3c",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
    fontSize: 13,
    textAlign: "center",
  },
  linkContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  linkText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
  },
  linkButton: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: "700",
    marginLeft: 4,
  },
});
