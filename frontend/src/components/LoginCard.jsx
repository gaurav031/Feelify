import {
  Flex,
  Box,
  FormControl,
  FormLabel,
  Input,
  InputGroup,
  InputRightElement,
  Stack,
  Button,
  Text,
  useColorModeValue,
  Link,
} from "@chakra-ui/react";
import { Image } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useSetRecoilState } from "recoil";
import authScreenAtom from "../atoms/authAtom";
import useShowToast from "../hooks/useShowToast";
import userAtom from "../atoms/userAtom";
import { useNavigate } from "react-router-dom";
import logo from '../assets/images/logo.png';

export default function LoginCard() {
  const [showPassword, setShowPassword] = useState(false);
  const setAuthScreen = useSetRecoilState(authScreenAtom);
  const setUser = useSetRecoilState(userAtom);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
  });
  const showToast = useShowToast();
  const navigate = useNavigate();

  // Load Google Script
  useEffect(() => {
    const loadGoogleScript = () => {
      // If already loaded, set state and return
      if (window.google) {
        setIsGoogleLoaded(true);
        return;
      }

      // Check if script is already added
      const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
      if (existingScript) {
        // If script exists but google isn't loaded yet, wait for it
        const checkGoogle = setInterval(() => {
          if (window.google) {
            setIsGoogleLoaded(true);
            clearInterval(checkGoogle);
          }
        }, 100);
        
        // Clear interval after 10 seconds
        setTimeout(() => clearInterval(checkGoogle), 10000);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      
      script.onload = () => {
        console.log("Google script loaded successfully");
        setIsGoogleLoaded(true);
      };
      
      script.onerror = () => {
        console.error("Failed to load Google script");
        setIsGoogleLoaded(false);
      };
      
      document.body.appendChild(script);
    };

    loadGoogleScript();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(inputs),
      });
      const data = await res.json();
      
      if (res.status === 404 || res.status === 400) {
        const errorMessage = data.error || data.message;
        if (errorMessage) {
          showToast("Error", errorMessage, "error");
          return;
        }
      }

      if (res.ok) {
        localStorage.setItem("user-threads", JSON.stringify(data));
        setUser(data);
        showToast("Success", "Login successful", "success");
        navigate("/");
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    try {
      if (!window.google) {
        showToast("Error", "Google Sign-In not loaded. Please try again.", "error");
        setGoogleLoading(false);
        return;
      }

      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: 'email profile openid',
        ux_mode: 'popup',
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
              showToast("Success", "Google login successful", "success");
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
      console.error("Google login error:", error);
      showToast("Error", "Failed to initialize Google Sign-In", "error");
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigate("/forgot-password");
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
            </Stack>
            <FormControl isRequired>
              <FormLabel>Username</FormLabel>
              <Input
                type='text'
                value={inputs.username}
                onChange={(e) => setInputs((inputs) => ({ ...inputs, username: e.target.value }))}
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <InputGroup>
                <Input
                  type={showPassword ? "text" : "password"}
                  value={inputs.password}
                  onChange={(e) => setInputs((inputs) => ({ ...inputs, password: e.target.value }))}
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
                loadingText='Logging in'
                size='lg'
                bg={useColorModeValue("gray.600", "gray.700")}
                color={"white"}
                _hover={{
                  bg: useColorModeValue("gray.700", "gray.800"),
                }}
                onClick={handleLogin}
                isLoading={loading}
              >
                Login
              </Button>
              <Button
                size='lg'
                variant="outline"
                onClick={handleGoogleLogin}
                isLoading={googleLoading}
                loadingText="Signing in with Google"
                isDisabled={!isGoogleLoaded || googleLoading}
              >
                <Image 
                  src="https://developers.google.com/identity/images/g-logo.png" 
                  alt="Google" 
                  boxSize="20px" 
                  mr={2}
                />
                {isGoogleLoaded ? "Continue with Google" : "Loading Google..."}
              </Button>
            </Stack>
            <Stack spacing={2}>
              <Link color={"blue.400"} onClick={handleForgotPassword} textAlign="center">
                Forgot Password?
              </Link>
              <Text align={"center"}>
                Don&apos;t have an account?{" "}
                <Link color={"blue.400"} onClick={() => setAuthScreen("signup")}>
                  Sign up
                </Link>
              </Text>
            </Stack>
          </Stack>
        </Box>
      </Stack>
    </Flex>
  );
}