import { useState } from "react";
import { Avatar } from "@chakra-ui/avatar";
import { Box, Flex, Link, Text, VStack } from "@chakra-ui/layout";
import { Menu, MenuButton, MenuItem, MenuList } from "@chakra-ui/menu";
import { Portal, Modal, ModalOverlay, ModalContent, ModalBody } from "@chakra-ui/react";
import { Button, Image, useToast, useColorModeValue } from "@chakra-ui/react";
import { BsInstagram } from "react-icons/bs";
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import userAtom from "../atoms/userAtom";
import { Link as RouterLink } from "react-router-dom";
import useFollowUnfollow from "../hooks/useFollowUnfollow";
import logo from "../assets/images";

const UserHeader = ({ user }) => {
  const toast = useToast();
  const currentUser = useRecoilValue(userAtom); // logged-in user
  const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

  const [isProfilePicOpen, setIsProfilePicOpen] = useState(false); // state to control modal

  const bgGradient = useColorModeValue(
    "linear(to-r, pink.200, purple.300)",
    "linear(to-r, purple.500, pink.600)"
  );
  const textColor = useColorModeValue("gray.800", "white");
  const buttonColor = useColorModeValue("blue.400", "teal.300");

  const copyURL = () => {
    const currentURL = window.location.href;
    navigator.clipboard.writeText(currentURL).then(() => {
      toast({
        title: "Success",
        status: "success",
        description: "Profile link copied.",
        duration: 3000,
        isClosable: true,
      });
    });
  };

  return (
    <VStack
      gap={4}
      alignItems="start"
      bgGradient={bgGradient}
      p={6}
      borderRadius="lg"
      shadow="xl"
      maxW="600px"
      mx="auto"
      transform="scale(1)"
      _hover={{ transform: "scale(1.02)", transition: "all 0.3s ease-in-out" }}
    >
      <Flex justifyContent="space-between" w="full" alignItems="center">
        <Box>
          <Text fontSize="3xl" fontWeight="bold" color={textColor} textShadow="1px 1px #000">
            {user.name}
          </Text>
          <Flex gap={2} alignItems="center">
            <Text fontSize="md" color={textColor}>
              @{user.username}
            </Text>
            <Text
              fontSize="sm"
              bg="yellow.400"
              color="gray.900"
              px={2}
              py={1}
              borderRadius="full"
              fontWeight="bold"
              shadow="md"
              _hover={{ transform: "scale(1.1)", transition: "all 0.3s" }}
            >
              Feelify.fun
            </Text>
          </Flex>
        </Box>
        <Avatar
          name={user.name}
          src={user.profilePic || "https://bit.ly/broken-link"}
          size={{ base: "lg", md: "2xl" }}
          border="4px solid"
          borderColor="purple.400"
          cursor="pointer"
          boxShadow="lg"
          _hover={{ transform: "rotate(5deg)", transition: "all 0.3s" }}
          onClick={() => setIsProfilePicOpen(true)}
        />
      </Flex>

      <Text color={textColor} fontSize="md" fontStyle="italic">
        {user.bio}
      </Text>

      {currentUser?._id === user._id ? (
        <Link as={RouterLink} to="/update">
          <Button
            size="sm"
            bg={buttonColor}
            color="white"
            _hover={{ bg: "blue.500", transform: "scale(1.1)" }}
          >
            Update Profile
          </Button>
        </Link>
      ) : (
        <Button
          size="sm"
          bg={following ? "red.400" : "green.400"}
          color="white"
          _hover={{ bg: following ? "red.500" : "green.500", transform: "scale(1.1)" }}
          onClick={handleFollowUnfollow}
          isLoading={updating}
        >
          {following ? "Unfollow" : "Follow"}
        </Button>
      )}

      <Flex w="full" justifyContent="space-between">
        <Flex gap={2} alignItems="center">
          <Link as={RouterLink} to={`/${user.username}/followerlist`}>
            <Text color="gray.300"_hover={{ color: "white" }}>
              {user.followers.length} followers
            </Text>
          </Link>
          
        </Flex>
        <Flex>
          <Box className="icon-container">
            <Image
              src={logo}
              height={{ base: 6, md: 6 }}
              width={{ base: 6, md: 6 }}
            />
          </Box>
          <Box className="icon-container">
            <Menu>
              <MenuButton>
                <CgMoreO size={24} cursor="pointer" />
              </MenuButton>
              <Portal>
                <MenuList bg="purple.700" borderColor="purple.500">
                  <MenuItem bg="purple.700" onClick={copyURL} _hover={{ bg: "purple.500" }}>
                    Copy link
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </Box>
        </Flex>
      </Flex>

      <Flex w="full" borderBottom="2px solid white">
        <Flex
          flex={1}
          justifyContent="center"
          pb={3}
          cursor="pointer"
          borderBottom="3px solid purple.400"
          color={textColor}
          _hover={{ transform: "scale(1.1)" }}
        >
          <Text fontWeight="bold">Threads</Text>
        </Flex>
        <Flex
          flex={1}
          justifyContent="center"
          color="gray.500"
          pb={3}
          cursor="pointer"
          _hover={{ color: "white", transform: "scale(1.1)" }}
        >
          <Text fontWeight="bold">Replies</Text>
        </Flex>
      </Flex>

      {/* Modal for zoomed-in profile picture */}
      <Modal isOpen={isProfilePicOpen} onClose={() => setIsProfilePicOpen(false)} isCentered>
        <ModalOverlay />
        <ModalContent maxW="sm" bg="transparent" boxShadow="none">
          <ModalBody p={0} display="flex" justifyContent="center">
            <Image
              src={user.profilePic || "https://bit.ly/broken-link"}
              borderRadius="full"
              width="300px"
              height="300px"
              shadow="2xl"
              border="5px solid purple.400"
              _hover={{ transform: "scale(1.05) rotate(3deg)", transition: "all 0.3s" }}
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </VStack>
  );
};

export default UserHeader;
