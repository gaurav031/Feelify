import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  HStack,
  InputRightElement,
  Stack,
  Button,
  Text,
  useColorModeValue,
  Link,
  FormErrorMessage,
  PinInput,
  PinInputField,
} from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useSetRecoilState } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import userAtom from "../atoms/userAtom";
import { Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import logo from '../assets/images/logo.png';

export default function SignupCard() {
  const [showPassword, setShowPassword] = useState(false);
  const [step, setStep] = useState(1);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const [inputs, setInputs] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    otp: "",
  });
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    username: "",
  });

  const showToast = useShowToast();
  const setUser = useSetRecoilState(userAtom);
  const navigate = useNavigate();

  // Load Google Script
  useEffect(() => {
    const loadGoogleScript = () => {
      if (window.google) return;

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    const usernameRegex = /^[a-z0-9_]+$/;
    if (username.charAt(0).match(/[0-9]/)) return "Username cannot start with a number.";
    if (!usernameRegex.test(username)) return "Username can only contain lowercase letters, numbers, and underscores.";
    return "";
  };

  const handleSendOTP = async () => {
    const { email, username } = inputs;

    let emailError = "";
    let usernameError = "";

    if (!validateEmail(email)) {
      emailError = "Please enter a valid email address.";
    }

    usernameError = validateUsername(username);

    if (emailError || usernameError) {
      setErrors({
        email: emailError,
        username: usernameError,
      });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users/signup/otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setStep(2);
        showToast("Success", "OTP sent to your email", "success");
      } else {
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTPAndSignup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("user-threads", JSON.stringify(data));
        setUser(data);
        showToast("Success", "Account created successfully", "success");
        navigate("/");
      } else {
        showToast("Error", data.message, "error");
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    try {
      if (!window.google) {
        showToast("Error", "Google Sign-In not loaded. Please try again.", "error");
        setGoogleLoading(false);
        return;
      }

      // Debug: Log the redirect URI being used
      console.log("Redirect URI:", window.location.origin);
      console.log("Client ID:", import.meta.env.VITE_GOOGLE_CLIENT_ID);

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        ux_mode: 'popup',
        // For popup mode, use 'postmessage' as redirect_uri
        redirect_uri: 'postmessage',
        callback: async (response) => {
          try {
            const tokenResponse = await fetch("/api/users/google-auth", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ code: response.code }),
            });

            const data = await tokenResponse.json();

            if (tokenResponse.ok) {
              localStorage.setItem("user-threads", JSON.stringify(data));
              setUser(data);
              showToast("Success", "Google signup successful", "success");
              navigate("/");
            } else {
              showToast("Error", data.message, "error");
            }
          } catch (error) {
            showToast("Error", "Failed to authenticate with Google", "error");
          } finally {
            setGoogleLoading(false);
          }
        },
      });

      client.requestCode();
    } catch (error) {
      console.error("Google signup error:", error);
      showToast("Error", "Failed to initialize Google Sign-In", "error");
      setGoogleLoading(false);
    }
  };

  return (
    <Flex align={"center"} justify={"center"}>
      <Stack spacing={8} mx={"auto"} maxW={"lg"} py={12} px={6}>
        <Box rounded={"lg"} bg={useColorModeValue("white", "gray.dark")} boxShadow={"lg"} p={8}>
          <Stack spacing={4}>
            <Stack align={"center"}>
              <Image src={logo} alt="Logo" boxSize="100px" objectFit="cover" />
            </Stack>

            {step === 1 && (
              <>
                <HStack>
                  <Box>
                    <FormControl isRequired>
                      <FormLabel>Full name</FormLabel>
                      <Input
                        type="text"
                        onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
                        value={inputs.name}
                      />
                    </FormControl>
                  </Box>
                  <Box>
                    <FormControl isRequired isInvalid={errors.username}>
                      <FormLabel>Username</FormLabel>
                      <Input
                        type="text"
                        onChange={(e) => setInputs({ ...inputs, username: e.target.value.toLowerCase() })}
                        value={inputs.username}
                      />
                      {errors.username && <FormErrorMessage>{errors.username}</FormErrorMessage>}
                    </FormControl>
                  </Box>
                </HStack>
                <FormControl isRequired isInvalid={errors.email}>
                  <FormLabel>Email address</FormLabel>
                  <Input
                    type="email"
                    onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                    value={inputs.email}
                  />
                  {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      type={showPassword ? "text" : "password"}
                      onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
                      value={inputs.password}
                    />
                    <InputRightElement h={"full"}>
                      <Button
                        variant={"ghost"}
                        onClick={() => setShowPassword((showPassword) => !showPassword)}
                      >
                        {showPassword ? <ViewIcon /> : <ViewOffIcon />}
                      </Button>
                    </InputRightElement>
                  </InputGroup>
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
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={handleGoogleSignup}
                    isLoading={googleLoading}
                    loadingText="Signing up with Google"
                    isDisabled={!window.google}
                  >
                    <Image 
                      src="https://developers.google.com/identity/images/g-logo.png" 
                      alt="Google" 
                      boxSize="20px" 
                      mr={2}
                    />
                    Continue with Google
                  </Button>
                </Stack>
              </>
            )}

            {step === 2 && (
              <>
                <Text align="center">Enter the OTP sent to {inputs.email}</Text>
                <Flex justify="center">
                  <PinInput otp value={inputs.otp} onChange={(value) => setInputs({ ...inputs, otp: value })}>
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                    <PinInputField />
                  </PinInput>
                </Flex>
                <Stack spacing={4} pt={2}>
                  <Button
                    loadingText="Creating account"
                    size="lg"
                    bg={useColorModeValue("gray.600", "gray.700")}
                    color={"white"}
                    _hover={{
                      bg: useColorModeValue("gray.700", "gray.800"),
                    }}
                    onClick={handleVerifyOTPAndSignup}
                    isLoading={loading}
                  >
                    Verify & Create Account
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => setStep(1)}
                  >
                    Back to previous step
                  </Button>
                </Stack>
              </>
            )}

            <Stack pt={6}>
              <Text align={"center"}>
                Already a user?{" "}
                <Link color={"blue.400"} onClick={() => setAuthScreen("login")}>
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