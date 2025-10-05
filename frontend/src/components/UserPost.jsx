import { Avatar, Image, Box, Flex, Text, useColorModeValue, Card, CardBody } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import Actions from "./Actions";
import { useState } from "react";
import { motion } from "framer-motion";

const UserPost = ({ postImg, postTitle, likes, replies, postId, username }) => {
	const [liked, setLiked] = useState(false);
	
	const bgColor = useColorModeValue("white", "gray.700");
  const cardBg = useColorModeValue("white", "gray.600");
  const borderColor = useColorModeValue("gray.200", "gray.500");
  const textColor = useColorModeValue("gray.800", "white");
  const subtleTextColor = useColorModeValue("gray.600", "gray.300");

	return (
		<motion.div
			whileHover={{ scale: 1.02 }}
			whileTap={{ scale: 0.98 }}
			transition={{ duration: 0.2 }}
		>
			<Link to={`/${username}/post/${postId}`}>
				<Card 
					bg={cardBg} 
					borderRadius="xl" 
					boxShadow="md" 
					mb={4}
					border="1px solid"
					borderColor={borderColor}
					overflow="hidden"
					_hover={{
						boxShadow: "xl",
						transform: "translateY(-2px)",
					}}
					transition="all 0.3s ease"
				>
					<CardBody p={4}>
						<Flex gap={4}>
							{/* Avatar and connection line */}
							<Flex flexDirection="column" alignItems="center" position="relative">
								<Avatar 
									size='md' 
									name={username} 
									src='/zuck-avatar.png' 
									border="2px solid"
									borderColor="blue.400"
								/>
								<Box 
									w='2px' 
									h={"full"} 
									bg='blue.200' 
									my={2} 
									position="absolute" 
									top="50px"
									zIndex={0}
								/>
								
								{/* Commenter avatars */}
								<Box position="relative" w="full" mt={2} zIndex={1}>
									<Avatar
										size='xs'
										name='John doe'
										src='https://bit.ly/dan-abramov'
										position="absolute"
										top="0px"
										left='12px'
										border="2px solid white"
										boxShadow="sm"
									/>
									<Avatar
										size='xs'
										name='John doe'
										src='https://bit.ly/sage-adebayo'
										position="absolute"
										bottom="0px"
										right='-5px'
										border="2px solid white"
										boxShadow="sm"
									/>
									<Avatar
										size='xs'
										name='John doe'
										src='https://bit.ly/prosper-baba'
										position="absolute"
										bottom="0px"
										left='2px'
										border="2px solid white"
										boxShadow="sm"
									/>
								</Box>
							</Flex>

							{/* Post content */}
							<Flex flex={1} flexDirection="column" gap={3}>
								<Flex justifyContent="space-between" alignItems="flex-start">
									<Flex alignItems="center" gap={2}>
										<Text fontSize="md" fontWeight="bold" color={textColor}>
											{username}
										</Text>
										<Image src='/verified.png' w={4} h={4} />
									</Flex>
									<Text fontSize="xs" color={subtleTextColor} fontWeight="medium">
										1d
									</Text>
								</Flex>

								<Text fontSize="sm" color={textColor} lineHeight="1.5">
									{postTitle}
								</Text>
								
								{postImg && (
									<Box 
										borderRadius="lg" 
										overflow="hidden" 
										border="1px solid" 
										borderColor={borderColor}
										mt={2}
									>
										<Image 
											src={postImg} 
											w="full" 
											objectFit="cover"
											_hover={{ transform: "scale(1.05)" }}
											transition="transform 0.3s ease"
										/>
									</Box>
								)}

								{/* Actions */}
								<Flex gap={3} mt={2}>
									<Actions liked={liked} setLiked={setLiked} />
								</Flex>

								{/* Stats */}
								<Flex gap={4} alignItems="center" fontSize="sm" color={subtleTextColor}>
									<Text fontWeight="medium">{replies} replies</Text>
									<Box w={1} h={1} borderRadius="full" bg={subtleTextColor} />
									<Text fontWeight="medium">{likes} likes</Text>
								</Flex>
							</Flex>
						</Flex>
					</CardBody>
				</Card>
			</Link>
		</motion.div>
	);
};

export default UserPost;