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
	Heading,
	Text,
	useColorModeValue,
	Link,
	FormErrorMessage,
  } from "@chakra-ui/react";
  import { useState } from "react";
  import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
  import { useSetRecoilState } from "recoil";
  import authScreenAtom from "../atoms/authAtom";
  import useShowToast from "../hooks/useShowToast";
  import userAtom from "../atoms/userAtom";
  import { Image } from "@chakra-ui/react";
  import logo from '../assets/images/logo.png';
  
  export default function SignupCard() {
	const [showPassword, setShowPassword] = useState(false);
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const [inputs, setInputs] = useState({
	  name: "",
	  username: "",
	  email: "",
	  password: "",
	});
  
	const [errors, setErrors] = useState({
	  email: "",
	  username: "",
	});
  
	const showToast = useShowToast();
	const setUser = useSetRecoilState(userAtom);
  
	const validateEmail = (email) => {
	  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	  return emailRegex.test(email);
	};
  
	const validateUsername = (username) => {
	  const usernameRegex = /^[a-z0-9]+$/; // Only lowercase letters and numbers
	  if (username.charAt(0).match(/[0-9]/)) return "Username cannot start with a number.";
	  if (!usernameRegex.test(username)) return "Username must be lowercase and contain no special characters.";
	  return "";
	};
  
	const handleSignup = async () => {
	  const { email, username } = inputs;
  
	  // Validate inputs
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
  
	  try {
		const res = await fetch("/api/users/signup", {
		  method: "POST",
		  headers: {
			"Content-Type": "application/json",
		  },
		  body: JSON.stringify(inputs),
		});
		const data = await res.json();
  
		if (data.error) {
		  showToast("Error", data.error, "error");
		  return;
		}
  
		localStorage.setItem("user-threads", JSON.stringify(data));
		setUser(data);
	  } catch (error) {
		showToast("Error", error, "error");
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
			  <HStack>
				<Box>
				  <FormControl isRequired isInvalid={errors.name}>
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
					  onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
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
			  <Stack spacing={10} pt={2}>
				<Button
				  loadingText="Submitting"
				  size="lg"
				  bg={useColorModeValue("gray.600", "gray.700")}
				  color={"white"}
				  _hover={{
					bg: useColorModeValue("gray.700", "gray.800"),
				  }}
				  onClick={handleSignup}
				>
				  Sign up
				</Button>
			  </Stack>
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
  