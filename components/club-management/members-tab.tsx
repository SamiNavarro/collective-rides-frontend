"use client"

import { useState, useMemo } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import { Loader2, Search, MoreVertical } from "lucide-react"
import { useClubMembersFiltered, useUpdateMemberRole, useRemoveMember } from "@/hooks/use-clubs"
import { ClubMember, ClubRole } from "@/lib/types/clubs"

interface MembersTabProps {
  clubId: string
  currentUserRole: ClubRole
}

// Helper to format role display
function formatRole(role: ClubRole): string {
  const roleMap: Record<ClubRole, string> = {
    member: 'Member',
    ride_leader: 'Ride Leader',
    ride_captain: 'Ride Captain',
    admin: 'Admin',
    owner: 'Owner',
  }
  return roleMap[role] || role
}

// Helper to get role badge variant
function getRoleBadgeVariant(role: ClubRole): "default" | "secondary" | "outline" {
  if (role === 'owner') return 'default'
  if (role === 'admin') return 'secondary'
  return 'outline'
}

export function MembersTab({ clubId, currentUserRole }: MembersTabProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<ClubRole | 'all'>('all')
  
  // Fetch members
  const { data: members, isLoading } = useClubMembersFiltered(clubId, {
    status: 'active',
  })
  
  const updateMemberRole = useUpdateMemberRole()
  const removeMember = useRemoveMember()

  // Filter members
  const filteredMembers = useMemo(() => {
    // Ensure members is always an array
    const membersList = Array.isArray(members) ? members : ((members as any)?.data || [])
    
    // Deduplicate by userId (backend may return duplicates)
    const uniqueMembers = membersList.reduce((acc: ClubMember[], member: ClubMember) => {
      if (!acc.find(m => m.userId === member.userId)) {
        acc.push(member)
      }
      return acc
    }, [])
    
    let filtered = uniqueMembers
    
    if (roleFilter !== 'all') {
      filtered = filtered.filter((m: ClubMember) => m.role === roleFilter)
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((m: ClubMember) =>
        m.displayName.toLowerCase().includes(query) ||
        m.email.toLowerCase().includes(query)
      )
    }
    
    return filtered
  }, [members, roleFilter, searchQuery])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">Loading members...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search members by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as ClubRole | 'all')}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="member">Members</SelectItem>
                <SelectItem value="ride_leader">Ride Leaders</SelectItem>
                <SelectItem value="ride_captain">Ride Captains</SelectItem>
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="owner">Owners</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Members List */}
      {filteredMembers.length > 0 ? (
        <div className="space-y-2">
          {filteredMembers.map((member: ClubMember) => (
            <MemberCard
              key={member.userId}
              member={member}
              currentUserRole={currentUserRole}
              onUpdateRole={(role, reason) => 
                updateMemberRole.mutateAsync({ clubId, userId: member.userId, role, reason })
              }
              onRemove={(reason) => 
                removeMember.mutateAsync({ clubId, userId: member.userId, reason })
              }
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">No members found</p>
              <p className="text-sm">
                {searchQuery || roleFilter !== 'all'
                  ? 'Try adjusting your search or filters'
                  : 'No active members in this club'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

interface MemberCardProps {
  member: ClubMember
  currentUserRole: ClubRole
  onUpdateRole: (role: ClubRole, reason?: string) => Promise<void>
  onRemove: (reason?: string) => Promise<void>
}

function MemberCard({ member, currentUserRole, onUpdateRole, onRemove }: MemberCardProps) {
  const [showRemoveDialog, setShowRemoveDialog] = useState(false)
  const [removeReason, setRemoveReason] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  // Determine available actions based on current user role
  const canManage = useMemo(() => {
    // Owners can manage everyone except other owners
    if (currentUserRole === 'owner') {
      return member.role !== 'owner'
    }
    // Admins can manage members and ride leaders/captains
    if (currentUserRole === 'admin') {
      return ['member', 'ride_leader', 'ride_captain'].includes(member.role)
    }
    return false
  }, [currentUserRole, member.role])

  const handleRoleChange = async (newRole: ClubRole) => {
    setIsUpdating(true)
    try {
      await onUpdateRole(newRole)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleRemove = async () => {
    setIsUpdating(true)
    try {
      await onRemove(removeReason || undefined)
      setShowRemoveDialog(false)
      setRemoveReason('')
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Avatar className="h-12 w-12">
                <AvatarImage src={member.avatarUrl} />
                <AvatarFallback>{member.displayName[0]?.toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{member.displayName}</p>
                <p className="text-sm text-muted-foreground truncate">{member.email}</p>
              </div>
              <Badge variant={getRoleBadgeVariant(member.role)}>
                {formatRole(member.role)}
              </Badge>
            </div>

            {canManage && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={isUpdating}>
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <MoreVertical className="h-4 w-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleRoleChange('member')}>
                    Change to Member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange('ride_leader')}>
                    Change to Ride Leader
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleRoleChange('ride_captain')}>
                    Change to Ride Captain
                  </DropdownMenuItem>
                  {currentUserRole === 'owner' && (
                    <DropdownMenuItem onClick={() => handleRoleChange('admin')}>
                      Change to Admin
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => setShowRemoveDialog(true)}
                    className="text-destructive focus:text-destructive"
                  >
                    Remove Member
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Remove Confirmation Dialog */}
      <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {member.displayName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {member.displayName} from the club. They can rejoin if invited again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="removeReason">Reason (optional)</Label>
            <Textarea
              id="removeReason"
              placeholder="e.g., Inactive member, code of conduct violation..."
              value={removeReason}
              onChange={(e) => setRemoveReason(e.target.value)}
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                'Remove Member'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
