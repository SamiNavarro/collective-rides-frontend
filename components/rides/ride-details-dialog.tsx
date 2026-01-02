"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, MapPin, Users, MessageCircle, Send } from "lucide-react"

interface RideDetailsDialogProps {
  ride: any
  isOpen: boolean
  onClose: () => void
  onJoinRide: () => void
}

const mockMessages = [
  {
    id: 1,
    user: { name: "Sarah M.", avatar: "SM" },
    message: "Looking forward to this ride! Weather looks perfect.",
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    user: { name: "Mike T.", avatar: "MT" },
    message: "Should we meet at the usual spot near the ferry terminal?",
    timestamp: "1 hour ago",
  },
  {
    id: 3,
    user: { name: "Emma K.", avatar: "EK" },
    message: "Yes! I'll bring some energy bars to share.",
    timestamp: "45 minutes ago",
  },
]

const mockAttendees = [
  { name: "Sarah M.", avatar: "SM", status: "Organizer" },
  { name: "Mike T.", avatar: "MT", status: "Going" },
  { name: "Emma K.", avatar: "EK", status: "Going" },
  { name: "James L.", avatar: "JL", status: "Going" },
  { name: "Sophie W.", avatar: "SW", status: "Maybe" },
]

export function RideDetailsDialog({ ride, isOpen, onClose, onJoinRide }: RideDetailsDialogProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState(mockMessages)

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: messages.length + 1,
        user: { name: "You", avatar: "Y" },
        message: newMessage,
        timestamp: "Just now",
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{ride.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Ride Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {new Date(ride.date).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {ride.time}
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {ride.location}
              </div>
            </div>

            <div className="flex gap-2">
              <Badge variant="outline">{ride.distance}</Badge>
              <Badge variant="outline">{ride.pace}</Badge>
              <Badge
                variant={
                  ride.difficulty === "Beginner"
                    ? "secondary"
                    : ride.difficulty === "Intermediate"
                      ? "default"
                      : "destructive"
                }
              >
                {ride.difficulty}
              </Badge>
            </div>

            <p className="text-muted-foreground">{ride.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback>{ride.organizer.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-sm">{ride.organizer.name}</p>
                  <p className="text-xs text-muted-foreground">Organizer</p>
                </div>
              </div>
              <Button onClick={onJoinRide} variant={ride.isJoined ? "secondary" : "default"}>
                {ride.isJoined ? "Leave Ride" : "Join Ride"}
              </Button>
            </div>
          </div>

          <Separator />

          {/* Attendees */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <h3 className="font-semibold">
                Attendees ({ride.attendees}/{ride.maxAttendees})
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {mockAttendees.map((attendee, index) => (
                <div key={index} className="flex items-center gap-2 bg-muted rounded-full px-3 py-1">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs">{attendee.avatar}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{attendee.name}</span>
                  {attendee.status === "Organizer" && (
                    <Badge variant="secondary" className="text-xs">
                      Organizer
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Chat */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-4 h-4" />
              <h3 className="font-semibold">Ride Chat</h3>
            </div>

            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="flex gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">{message.user.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{message.user.name}</span>
                        <span className="text-xs text-muted-foreground">{message.timestamp}</span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2 mt-3">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              />
              <Button size="sm" onClick={handleSendMessage}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
