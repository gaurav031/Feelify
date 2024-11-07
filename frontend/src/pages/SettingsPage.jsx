import { Button, Text, Box, VStack, useToast, useColorMode } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { FiLogOut } from "react-icons/fi";

export const SettingsPage = () => {
  const showToast = useShowToast();
  const logout = useLogout();
  const { colorMode } = useColorMode(); // Hook to get current color mode

  const freezeAccount = async () => {
    if (!window.confirm("Are you sure you want to freeze your account?")) return;

    try {
      const res = await fetch("/api/users/freeze", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.error) {
        return showToast("Error", data.error, "error");
      }
      if (data.success) {
        await logout();
        showToast("Success", "Your account has been frozen", "success");
      }
    } catch (error) {
      showToast("Error", error.message, "error");
    }
  };

  return (
    <Box
      maxW="600px"
      mx="auto"
      p={5}
      borderRadius="md"
      boxShadow="lg"
      bg={colorMode === "dark" ? "black" : "white"} // Conditional background color based on dark mode
      mt={10}
      mb={5}
      color={colorMode === "dark" ? "white" : "gray.700"} // Adjust text color for dark mode
    >
      <VStack align="start" spacing={4}>
        {/* Title */}
        <Text
          fontSize="2xl"
          fontWeight="bold"
          textAlign="center"
        >
          Account Settings
        </Text>

        {/* Account Freeze Section */}
        <Box
          p={4}
          borderRadius="md"
          bg={colorMode === "dark" ? "gray.700" : "gray.50"} // Background color change for dark mode
          boxShadow="md"
          w="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Text fontSize="lg" fontWeight="semibold" color={colorMode === "dark" ? "white" : "gray.600"}>
            Freeze Your Account
          </Text>
          <Text fontSize="sm" color={colorMode === "dark" ? "gray.300" : "gray.500"} mb={4}>
            You can unfreeze your account anytime by logging in again.
          </Text>
          <Button
            size="lg"
            colorScheme="red"
            onClick={freezeAccount}
            width="100%"
            mb={3}
            _hover={{
              bg: "red.600",
            }}
          >
            Freeze Account
          </Button>
        </Box>

        {/* Logout Section */}
        <Box
          p={4}
          borderRadius="md"
          bg={colorMode === "dark" ? "gray.700" : "gray.50"}
          boxShadow="md"
          w="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Button
            size="lg"
            colorScheme="blue"
            leftIcon={<FiLogOut />}
            onClick={logout}
            width="100%"
            _hover={{
              bg: "blue.600",
            }}
          >
            Logout
          </Button>
        </Box>
      </VStack>
    </Box>
  );
};
