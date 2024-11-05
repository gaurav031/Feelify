import { SearchIcon, ArrowBackIcon } from "@chakra-ui/icons";
import {
  Box,
  Button,
  Flex,
  IconButton,
  Input,
  Skeleton,
  SkeletonCircle,
  Text,
  useColorModeValue,
  Image,
  useColorMode,
  Avatar,
  Divider,
} from "@chakra-ui/react";
import Conversation from "../components/Conversation";
import MessageContainer from "../components/MessageContainer";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom } from "../atoms/messagesAtom";
import userAtom from "../atoms/userAtom";
import { useSocket } from "../context/SocketContext";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const [searchingUser, setSearchingUser] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { socket, onlineUsers } = useSocket();
  const [showConversations, setShowConversations] = useState(true);
  const { colorMode } = useColorMode();
  const navigate = useNavigate();
  const messageSound = new Audio("/src/assets/sound/message.mp3");

  // Utility function to sort conversations by the most recent message
  const sortConversations = (convs) =>
    convs.sort((a, b) => new Date(b.lastMessage.date) - new Date(a.lastMessage.date));

  useEffect(() => {
    socket?.on("newMessage", (newMessage) => {
      setConversations((prev) => {
        const updatedConversations = [
          newMessage,
          ...prev.filter((conversation) => conversation._id !== newMessage._id),
        ];
        messageSound.play();
        return sortConversations(updatedConversations);
      });
    });
  }, [socket, setConversations]);

  useEffect(() => {
    const getConversations = async () => {
      try {
        const res = await fetch("/api/messages/conversations");
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
          return;
        }
        setConversations(sortConversations(data));
      } catch (error) {
        showToast("Error", error.message, "error");
      } finally {
        setLoadingConversations(false);
      }
    };

    getConversations();
  }, [showToast, setConversations]);

  const handleConversationSearch = async (e) => {
    e.preventDefault();
    setSearchingUser(true);
    try {
      const res = await fetch(`/api/users/profile/${searchText}`);
      const searchedUser = await res.json();
      if (searchedUser.error) {
        showToast("Error", searchedUser.error, "error");
        return;
      }

      if (searchedUser._id === currentUser._id) {
        showToast("Error", "You cannot message yourself", "error");
        return;
      }

      const conversationExists = conversations.find(
        (conversation) => conversation.participants[0]._id === searchedUser._id
      );

      if (conversationExists) {
        setSelectedConversation({
          _id: conversationExists._id,
          userId: searchedUser._id,
          username: searchedUser.username,
          userProfilePic: searchedUser.profilePic,
        });
        setShowConversations(false);
        return;
      }

      const mockConversation = {
        mock: true,
        lastMessage: {
          text: "",
          sender: "",
          date: new Date().toISOString(),
        },
        _id: Date.now(),
        participants: [
          {
            _id: searchedUser._id,
            username: searchedUser.username,
            profilePic: searchedUser.profilePic,
          },
        ],
      };
      setConversations((prevConvs) => sortConversations([mockConversation, ...prevConvs]));
    } catch (error) {
      showToast("Error", error.message, "error");
    } finally {
      setSearchingUser(false);
    }
  };

  const handleConversationClick = (conversation) => {
    setSelectedConversation({
      _id: conversation._id,
      userId: conversation.participants[0]._id,
      userProfilePic: conversation.participants[0].profilePic,
      username: conversation.participants[0].username,
      mock: conversation.mock,
    });
    setShowConversations(false);
  };

  const handleBackClick = () => {
    if (showConversations) {
      navigate("/");
    } else {
      setShowConversations(true);
      setSelectedConversation(null);
    }
  };

  return (
    <Box
      position={"absolute"}
      left={"50%"}
      w={{ base: "100%", md: "80%", lg: "750px" }}
      p={4}
      transform={"translateX(-50%)"}
      
      borderRadius="lg"
      boxShadow="2xl"
      height={700}
    >
      <Flex alignItems="center" justifyContent="space-between" mb={4} >
        <>
          <IconButton
            aria-label="Back to conversations"
            icon={<ArrowBackIcon />}
            onClick={handleBackClick}
            variant="ghost"
          />
          <Avatar size="sm" name={currentUser.name} src={currentUser?.profilePic} ml={-10}/>
          <Text fontWeight={500} fontSize="md" ml={-1}>
            {currentUser.username}
          </Text>
        </>
        <Flex alignItems="center" gap={2}>
          <Input
            width={130}
            placeholder="Search Here"
            onChange={(e) => setSearchText(e.target.value)}
            variant="filled"
          />
          <Button size="sm" onClick={handleConversationSearch} isLoading={searchingUser} colorScheme="teal">
            <SearchIcon />
          </Button>
        </Flex>
      </Flex>

      <Flex gap={4} flexDirection={{ base: "column", md: "row" }}>
    {showConversations && (
        <Box
            flex={30}
            borderRadius="lg"
            p={4}
            boxShadow="base"
            overflowY="auto"
            maxH="400px"
            height={7000}
        >
            <Text fontWeight={700} fontSize="lg" mb={4} color={useColorModeValue("gray.600", "gray.300")}>
                Your Conversations
            </Text>
            {loadingConversations
                ? Array(5)
                    .fill("")
                    .map((_, i) => (
                        <Flex key={i} gap={4} alignItems="center" p={2} borderRadius="md" _hover={{ bg: "gray.100" }}>
                            <SkeletonCircle size="10" />
                            <Box flex="1">
                                <Skeleton height="10px" mb={2} />
                                <Skeleton height="8px" />
                            </Box>
                        </Flex>
                    ))
                : conversations.map((conversation, index) => (
                    <Box key={conversation._id}>
                        <Flex
                            alignItems="center"
                            p={3}
                            borderRadius="md"
                            bg={useColorModeValue("white", "gray.800")}
                            boxShadow="sm"
                            _hover={{ bg: useColorModeValue("gray.100", "gray.600"), cursor: "pointer" }}
                            onClick={() => handleConversationClick(conversation)}
                        >
                            <Image
                                src={conversation.participants[0].profilePic}
                                borderRadius="full"
                                boxSize="40px"
                                objectFit="cover"
                                fallbackSrc="/default-avatar.png"
                            />
                            <Box ml={3}>
                                <Text fontWeight={700}>{conversation.participants[0].username}</Text>
                                <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.400")}>
                                    {conversation.lastMessage.text || "No messages yet"}
                                </Text>
                            </Box>
                            {onlineUsers.includes(conversation.participants[0]._id) && (
                                <Box
                                    bg="green.400"
                                    borderRadius="full"
                                    boxSize={3}
                                    ml={2}
                                    border="2px solid white"
                                />
                            )}
                        </Flex>
                        {index < conversations.length - 1 && <Divider    my={2} />} {/* Add a divider except after the last item */}
                    </Box>
                ))}
        </Box>
        )}
        {!showConversations && selectedConversation?._id && (
          <MessageContainer
            selectedConversation={selectedConversation}
            socket={socket}
            setShowConversations={setShowConversations}
          />
        )}
      </Flex>
    </Box>
  );
};

export default ChatPage;
