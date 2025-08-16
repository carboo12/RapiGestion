import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Map, MapPin, Phone, PlusCircle, Navigation } from "lucide-react";

const collectors = [
  { 
    name: 'Carlos Rodriguez', 
    avatar: 'CR',
    progress: 75, 
    route: [
      { name: 'Alice Johnson', address: '1234 Elm St', status: 'Paid' },
      { name: 'Robert Brown', address: '5678 Oak St', status: 'Paid' },
      { name: 'Emily Davis', address: '9101 Pine St', status: 'Pending' },
      { name: 'Michael Wilson', address: '1213 Maple St', status: 'No answer' },
    ] 
  },
  { 
    name: 'Maria Sanchez', 
    avatar: 'MS',
    progress: 40,
    route: [
      { name: 'David Williams', address: '2122 Cedar St', status: 'Paid' },
      { name: 'Jessica Garcia', address: '3334 Walnut St', status: 'Pending' },
      { name: 'James Martinez', address: '4546 Chestnut St', status: 'Pending' },
      { name: 'Linda Hernandez', address: '5758 Poplar St', status: 'Pending' },
      { name: 'Joseph Clark', address: '6960 Spruce St', status: 'Pending' },
    ]
  },
];

export default function RoutesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Daily Routes</h2>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" /> Assign New Route
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {collectors.map((collector) => (
          <Card key={collector.name}>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={`https://placehold.co/100x100.png`} data-ai-hint="person avatar" />
                  <AvatarFallback>{collector.avatar}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{collector.name}</CardTitle>
                  <CardDescription>Collection Manager</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium">Route Progress</span>
                  <span className="text-sm text-muted-foreground">{collector.progress}%</span>
                </div>
                <Progress value={collector.progress} />
              </div>
              <Separator />
              <div className="space-y-4">
                <h4 className="text-sm font-semibold flex items-center gap-2"><Map className="w-4 h-4 text-muted-foreground" /> Route for Today</h4>
                <ul className="space-y-3">
                  {collector.route.map((stop, index) => (
                    <li key={index} className="flex items-start gap-4">
                      <MapPin className="w-5 h-5 mt-1 text-primary"/>
                      <div className="flex-1">
                        <p className="font-medium">{stop.name}</p>
                        <p className="text-sm text-muted-foreground">{stop.address}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Phone className="h-4 w-4"/>
                        </Button>
                        <Button variant="outline" size="icon" className="h-8 w-8">
                          <Navigation className="h-4 w-4"/>
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
