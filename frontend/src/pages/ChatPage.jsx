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
        // Play sound and update conversations list on new message
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
                // Sort conversations after fetching
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
        >
            <Flex alignItems="center" justifyContent="space-between" mb={4}>
                <>
                    <IconButton
                        aria-label="Back to conversations"
                        icon={<ArrowBackIcon />}
                        onClick={handleBackClick}
                        mt={5}
                    />
                    <Avatar
                        size='sm'
                        name={currentUser.name}
                        src={currentUser?.profilePic}
                        mt={5} ml={{ base: "0", lg: "-250px" }}
                    />
                    <Text fontWeight={500} fontSize="sm" mt={5} ml={{ base: "0", lg: "-200px" }}>
                        {currentUser.username}
                    </Text>
                </>
                <Flex alignItems="center" gap={2} mt={5}>
                    <Input
                        width={150}
                        placeholder="Search for a user"
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <Button size={"sm"} onClick={handleConversationSearch} isLoading={searchingUser}>
                        <SearchIcon />
                    </Button>
                </Flex>
            </Flex>

            <Flex
                gap={4}
                flexDirection={{ base: "column", md: "row" }}
                maxW={{ sm: "400px", md: "full" }}
                mx={"auto"}
            >
                {showConversations && (
                    <Flex
                        flex={30}
                        gap={2}
                        flexDirection={"column"}
                        maxW={{ sm: "250px", md: "full" }}
                        mx={"auto"}
                        ml={{ base: "-1", md: "0" }}
                        borderRadius={"lg"}
                        boxShadow={"md"}
                        p={4}
                    >
                        <Text fontWeight={700} fontSize="lg" color={useColorModeValue("gray.600", "gray.400")}>
                            Your Conversations
                        </Text>

                        {loadingConversations &&
                            [0, 1, 2, 3, 4].map((_, i) => (
                                <Flex
                                    key={i}
                                    gap={4}
                                    alignItems={"center"}
                                    p={"1"}
                                    borderRadius={"md"}
                                    _hover={{ bg: useColorModeValue("gray.100", "gray.700") }}
                                    transition="background 0.2s"
                                >
                                    <Box>
                                        <SkeletonCircle size={"10"} />
                                    </Box>
                                    <Flex w={"full"} flexDirection={"column"} gap={1}>
                                        <Skeleton h={"10px"} w={"80px"} />
                                        <Skeleton h={"8px"} w={"90%"} />
                                    </Flex>
                                </Flex>
                            ))}

                        {!loadingConversations &&
                            conversations.map((conversation) => (
                                <Flex
                                    key={conversation._id}
                                    alignItems={"center"}
                                    p={2}
                                    borderRadius={"md"}
                                    _hover={{ bg: useColorModeValue("gray.100", "gray.700"), cursor: "pointer" }}
                                    transition="background 0.2s"
                                    onClick={() => handleConversationClick(conversation)}
                                >
                                    <Box>
                                        <Image
                                            src={conversation.participants[0].profilePic}
                                            alt={`${conversation.participants[0].username}'s profile`}
                                            borderRadius="full"
                                            boxSize="40px"
                                            objectFit="cover"
                                            fallbackSrc="/path/to/default-avatar.png"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = "/path/to/default-avatar.png";
                                            }}
                                        />
                                    </Box>
                                    <Box ml={2}>
                                        <Text fontWeight={700}>{conversation.participants[0].username}</Text>
                                        <Text fontSize="sm" color={useColorModeValue("gray.500", "gray.300")}>
                                            {conversation.lastMessage.text}
                                        </Text>
                                    </Box>
                                    {onlineUsers.includes(conversation.participants[0]._id) && (
                                        <Box
                                            bg="green.500"
                                            borderRadius="full"
                                            boxSize={3}
                                            ml={2}
                                            borderWidth={2}
                                            borderColor="white"
                                        />
                                    )}
                                </Flex>
                            ))}
                    </Flex>
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
