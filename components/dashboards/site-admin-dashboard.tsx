"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  Shield,
  Activity,
  AlertTriangle,
  TrendingUp,
  Settings,
  Database,
  Globe,
  BarChart3,
  UserCheck,
} from "lucide-react"

export function SiteAdminDashboard() {
  const systemStats = {
    totalUsers: 2847,
    activeClubs: 156,
    totalRides: 1234,
    pendingReports: 3,
    systemHealth: "Excellent",
    serverUptime: "99.9%",
  }

  const recentActivity = [
    { type: "user_signup", message: "New user registered: john.doe@email.com", time: "2 minutes ago" },
    { type: "club_created", message: "New club created: Inner West Riders", time: "15 minutes ago" },
    { type: "report_submitted", message: "Content report submitted for review", time: "1 hour ago" },
    { type: "system_update", message: "Database backup completed successfully", time: "2 hours ago" },
  ]

  const pendingActions = [
    { id: 1, type: "User Report", description: "Inappropriate behavior reported", priority: "High" },
    { id: 2, type: "Club Verification", description: "New club awaiting verification", priority: "Medium" },
    { id: 3, type: "Content Moderation", description: "Flagged content needs review", priority: "Low" },
  ]

  return (
    <div className="space-y-6">
      {/* System Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Clubs</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.activeClubs}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{systemStats.totalRides.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +23% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{systemStats.systemHealth}</div>
            <p className="text-xs text-muted-foreground">Uptime: {systemStats.serverUptime}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Pending Actions
            </CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.map((action) => (
              <div key={action.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium">{action.type}</h4>
                  <p className="text-sm text-muted-foreground">{action.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      action.priority === "High"
                        ? "destructive"
                        : action.priority === "Medium"
                          ? "default"
                          : "secondary"
                    }
                  >
                    {action.priority}
                  </Badge>
                  <Button size="sm">Review</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest system events and user actions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="flex-shrink-0 mt-1">
                  {activity.type === "user_signup" && <UserCheck className="h-4 w-4 text-green-600" />}
                  {activity.type === "club_created" && <Users className="h-4 w-4 text-blue-600" />}
                  {activity.type === "report_submitted" && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                  {activity.type === "system_update" && <Database className="h-4 w-4 text-purple-600" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm">{activity.message}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Users className="h-5 w-5" />
              Manage Users
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Shield className="h-5 w-5" />
              Club Oversight
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <BarChart3 className="h-5 w-5" />
              Analytics
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent">
              <Globe className="h-5 w-5" />
              System Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
