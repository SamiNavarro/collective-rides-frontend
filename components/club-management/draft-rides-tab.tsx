"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2, CheckCircle, XCircle, Calendar, Clock, User, ExternalLink } from "lucide-react"
import { usePublishRide, useCancelRide } from "@/hooks/use-rides"
import { format, formatDistanceToNow } from 'date-fns'

interface DraftRidesTabProps {
  clubId: string
  draftRides: any[] // TODO: Type this properly with RideDetail
}

// Helper to format ride type
function formatRideType(type: string): string {
  const typeMap: Record<string, string> = {
    training: 'Training',
    social: 'Social',
    competitive: 'Competitive',
    adventure: 'Adventure',
    maintenance: 'Maintenance',
  }
  return typeMap[type] || type
}

// Helper to format difficulty
function formatDifficulty(difficulty: string): string {
  const diffMap: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert',
  }
  return diffMap[difficulty] || difficulty
}

export function DraftRidesTab({ clubId, draftRides }: DraftRidesTabProps) {
  const publishRide = usePublishRide()
  const cancelRide = useCancelRide()

  if (!draftRides || draftRides.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No draft rides pending</p>
            <p className="text-sm">Member-proposed rides will appear here for approval</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {draftRides.map((ride) => (
        <DraftRideCard
          key={ride.id || ride.rideId}
          ride={ride}
          onPublish={() =>
            publishRide.mutateAsync({ clubId, rideId: ride.id || ride.rideId })
          }
          onReject={(reason) =>
            cancelRide.mutateAsync({ clubId, rideId: ride.id || ride.rideId, reason })
          }
        />
      ))}
    </div>
  )
}

interface DraftRideCardProps {
  ride: any // TODO: Type this properly
  onPublish: () => Promise<void>
  onReject: (reason?: string) => Promise<void>
}

function DraftRideCard({ ride, onPublish, onReject }: DraftRideCardProps) {
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handlePublish = async () => {
    setIsProcessing(true)
    try {
      await onPublish()
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(rejectReason || undefined)
      setShowRejectDialog(false)
      setRejectReason('')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            <div className="flex-1 w-full">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-lg font-semibold">{ride.title}</h3>
                <Badge variant="secondary">Draft</Badge>
                {ride.route?.notes && (
                  <Badge variant="outline">Route attached</Badge>
                )}
              </div>

              <div className="space-y-2 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {ride.startDateTime 
                      ? format(new Date(ride.startDateTime), 'PPP p')
                      : 'Date TBD'
                    }
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>Created by {ride.createdByName || 'Unknown'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Proposed {ride.createdAt 
                      ? formatDistanceToNow(new Date(ride.createdAt), { addSuffix: true })
                      : 'recently'
                    }
                  </span>
                </div>
              </div>

              {ride.description && (
                <p className="text-sm mb-3 line-clamp-2">{ride.description}</p>
              )}

              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline">{formatRideType(ride.rideType)}</Badge>
                <Badge variant="outline">{formatDifficulty(ride.difficulty)}</Badge>
                <Badge variant="outline">{ride.estimatedDuration} min</Badge>
                {ride.maxParticipants && (
                  <Badge variant="outline">Max {ride.maxParticipants} riders</Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 w-full lg:w-auto lg:flex-col">
              <Button
                onClick={handlePublish}
                disabled={isProcessing}
                className="flex-1 lg:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Publish
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="flex-1 lg:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Link href={`/clubs/${ride.clubId}/rides/${ride.id}`} target="_blank">
                <Button variant="ghost" size="sm" className="w-full lg:w-auto">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject this ride proposal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the draft ride. The creator will be able to see the rejection reason.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Reason (optional)</Label>
            <Textarea
              id="rejectReason"
              placeholder="e.g., Route not suitable, timing conflicts with other rides..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejecting...
                </>
              ) : (
                'Reject Draft'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
