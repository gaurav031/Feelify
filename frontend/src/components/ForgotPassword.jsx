import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  Stack,
  Button,
  Heading,
  Text,
  useColorModeValue,
  Link,
  HStack,
  PinInput,
  PinInputField,
  Alert,
  AlertIcon,
} from "@chakra-ui/react";
import { useState } from "react";
import { useSetRecoilState } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import { useNavigate } from "react-router-dom";
import { Image } from "@chakra-ui/react";
import logo from '../assets/images/logo.png';

export default function ForgotPassword() {
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New password
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  
  const showToast = useShowToast();
  const navigate = useNavigate();
  const setAuthScreen = useSetRecoilState(authScreenAtom);

  const handleSendOTP = async () => {
    if (!email) {
      showToast("Error", "Please enter your email", "error");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/send-password-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(2);
        showToast("Success", "OTP sent to your email", "success");
      } else {
        setError(data.message);
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
      showToast("Error", "Failed to send OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      showToast("Error", "Please enter a valid 6-digit OTP", "error");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/verify-password-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep(3);
        showToast("Success", "OTP verified successfully", "success");
      } else {
        setError(data.message);
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      setError("Failed to verify OTP. Please try again.");
      showToast("Error", "Failed to verify OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 6) {
      showToast("Error", "Password must be at least 6 characters long", "error");
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast("Error", "Passwords do not match", "error");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/reset-password-with-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otp,
          newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast("Success", "Password reset successfully", "success");
        setAuthScreen("login");
        navigate("/auth");
      } else {
        setError(data.message);
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      setError("Failed to reset password. Please try again.");
      showToast("Error", "Failed to reset password. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/users/send-password-reset-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtp(""); // Clear previous OTP
        showToast("Success", "New OTP sent to your email", "success");
      } else {
        setError(data.message);
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
      showToast("Error", "Failed to resend OTP. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLoginClick = () => {
    navigate("/auth");
  };

  const handleGoBack = () => {
    if (step === 2) {
      setStep(1);
      setOtp("");
    } else if (step === 3) {
      setStep(2);
      setNewPassword("");
      setConfirmPassword("");
    }
    setError("");
  };

  return (
    <Flex align={"center"} justify={"center"}>
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Box
          rounded={"lg"}
          bg={useColorModeValue("white", "gray.dark")}
          boxShadow={"lg"}
          p={8}
          w={{
            base: "full",
            sm: "400px",
          }}
        >
          <Stack spacing={4}>
            <Stack align={"center"}>
              <Image src={logo} alt="Logo" boxSize="100px" objectFit="cover" />
              <Heading fontSize={"2xl"}>Reset Password</Heading>
            </Stack>

            {error && (
              <Alert status="error" borderRadius="md">
                <AlertIcon />
                {error}
              </Alert>
            )}

            {step === 1 && (
              <>
                <Text align="center" color="gray.600" fontSize="sm">
                  Enter your email address and we'll send you an OTP to reset your password.
                </Text>
                <FormControl isRequired>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </FormControl>
                <Stack spacing={4} pt={2}>
                  <Button
                    loadingText="Sending OTP"
                    size="lg"
                    bg={useColorModeValue("gray.600", "gray.700")}
                    color={"white"}
                    _hover={{
                      bg: useColorModeValue("gray.700", "gray.800"),
                    }}
                    onClick={handleSendOTP}
                    isLoading={loading}
                  >
                    Send OTP
                  </Button>
                </Stack>
              </>
            )}

            {step === 2 && (
              <>
                <Text align="center" color="gray.600" fontSize="sm">
                  Enter the 6-digit OTP sent to <strong>{email}</strong>
                </Text>
                <FormControl isRequired>
                  <FormLabel>OTP Code</FormLabel>
                  <HStack justifyContent="center">
                    <PinInput value={otp} onChange={setOtp} otp size="lg">
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                      <PinInputField />
                    </PinInput>
                  </HStack>
                </FormControl>
                <Stack spacing={4} pt={2}>
                  <Button
                    loadingText="Verifying"
                    size="lg"
                    bg={useColorModeValue("gray.600", "gray.700")}
                    color={"white"}
                    _hover={{
                      bg: useColorModeValue("gray.700", "gray.800"),
                    }}
                    onClick={handleVerifyOTP}
                    isLoading={loading}
                    isDisabled={otp.length !== 6}
                  >
                    Verify OTP
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    isDisabled={loading}
                  >
                    Back
                  </Button>
                </Stack>
                <Stack pt={2}>
                  <Text align={"center"} fontSize="sm">
                    Didn't receive OTP?{" "}
                    <Link color={"blue.400"} onClick={handleResendOTP}>
                      Resend OTP
                    </Link>
                  </Text>
                </Stack>
              </>
            )}

            {step === 3 && (
              <>
                <Text align="center" color="gray.600" fontSize="sm">
                  Enter your new password
                </Text>
                <FormControl isRequired>
                  <FormLabel>New Password</FormLabel>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </FormControl>
                <Stack spacing={4} pt={2}>
                  <Button
                    loadingText="Resetting"
                    size="lg"
                    bg={useColorModeValue("gray.600", "gray.700")}
                    color={"white"}
                    _hover={{
                      bg: useColorModeValue("gray.700", "gray.800"),
                    }}
                    onClick={handleResetPassword}
                    isLoading={loading}
                    isDisabled={newPassword.length < 6 || newPassword !== confirmPassword}
                  >
                    Reset Password
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleGoBack}
                    isDisabled={loading}
                  >
                    Back
                  </Button>
                </Stack>
              </>
            )}

            <Stack pt={6}>
              <Text align={"center"} fontSize="sm">
                Remember your password?{" "}
                <Link color={"blue.400"} onClick={handleLoginClick}>
                  Login
                </Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
}