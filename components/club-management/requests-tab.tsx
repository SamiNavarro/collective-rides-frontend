"use client"

import { useState } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { useClubMembersFiltered, useProcessJoinRequest } from "@/hooks/use-clubs"
import { ClubMember } from "@/lib/types/clubs"
import { formatDistanceToNow } from 'date-fns'

interface RequestsTabProps {
  clubId: string
}

export function RequestsTab({ clubId }: RequestsTabProps) {
  const { data: pendingRequests, isLoading } = useClubMembersFiltered(clubId, {
    status: 'pending',
  })
  
  const processRequest = useProcessJoinRequest()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading requests...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!pendingRequests || pendingRequests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">No pending requests</p>
            <p className="text-sm">Join requests will appear here for approval</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Deduplicate by membershipId (backend may return duplicates)
  const uniqueRequests = pendingRequests.reduce((acc: ClubMember[], request: ClubMember) => {
    if (!acc.find(r => r.membershipId === request.membershipId)) {
      acc.push(request)
    }
    return acc
  }, [])

  return (
    <div className="space-y-4">
      {uniqueRequests.map((request) => (
        <RequestCard
          key={request.membershipId}
          request={request}
          onApprove={(message) =>
            processRequest.mutateAsync({
              clubId,
              membershipId: request.membershipId,
              action: 'approve',
              message,
            })
          }
          onReject={(message) =>
            processRequest.mutateAsync({
              clubId,
              membershipId: request.membershipId,
              action: 'reject',
              message,
            })
          }
        />
      ))}
    </div>
  )
}

interface RequestCardProps {
  request: ClubMember
  onApprove: (message?: string) => Promise<void>
  onReject: (message?: string) => Promise<void>
}

function RequestCard({ request, onApprove, onReject }: RequestCardProps) {
  const [showApproveDialog, setShowApproveDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [approveMessage, setApproveMessage] = useState('')
  const [rejectMessage, setRejectMessage] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const handleApprove = async () => {
    setIsProcessing(true)
    try {
      await onApprove(approveMessage || undefined)
      setShowApproveDialog(false)
      setApproveMessage('')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async () => {
    setIsProcessing(true)
    try {
      await onReject(rejectMessage || undefined)
      setShowRejectDialog(false)
      setRejectMessage('')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={request.avatarUrl} />
                <AvatarFallback>{request.displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-lg">{request.displayName}</p>
                <p className="text-sm text-muted-foreground">{request.email}</p>
                {request.joinMessage && (
                  <div className="mt-3 p-3 bg-muted rounded-md">
                    <p className="text-sm">{request.joinMessage}</p>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Requested {request.requestedAt ? formatDistanceToNow(new Date(request.requestedAt), { addSuffix: true }) : 'recently'}
                </p>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => setShowApproveDialog(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(true)}
                disabled={isProcessing}
                className="flex-1 sm:flex-none"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {request.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will add {request.displayName} as a member of the club.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="approveMessage">Welcome message (optional)</Label>
            <Textarea
              id="approveMessage"
              placeholder="Welcome to the club! Looking forward to riding with you."
              value={approveMessage}
              onChange={(e) => setApproveMessage(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Approving...
                </>
              ) : (
                'Approve Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {request.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will decline their request to join the club.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectMessage">Reason (optional)</Label>
            <Textarea
              id="rejectMessage"
              placeholder="e.g., Club is at capacity, requirements not met..."
              value={rejectMessage}
              onChange={(e) => setRejectMessage(e.target.value)}
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
                'Reject Request'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
