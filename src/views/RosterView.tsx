import { useState } from "react";
import type { Swimmer } from "../types";
import { v4 as uuidv4 } from 'uuid'

export default function RosterView() {
  const [swimmers, setSwimmers] = useState<Swimmer[]>([])

  const [swimmer, setSwimmer] = useState<Omit<Swimmer, 'id'>>({
    firstName: "",
    lastName: "",
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSwimmer(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function addSwimmer(swimmer: Omit<Swimmer, 'id'>) {
    const { firstName, lastName } = swimmer
    setSwimmers(prev => [...prev, { id: uuidv4(), firstName, lastName }])
    setSwimmer({ firstName: "", lastName: "" })
  }

  function removeSwimmer(id: string) {
    setSwimmers(prev => prev.filter(swimmer => swimmer.id !== id))
  }
  return (
    <div>
      {swimmers.map((swimmer) => {
        return (
          <div key={swimmer.id} className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 rounded-full bg-teal-light flex items-center justify-center">
              <span className="text-sm font-medium text-teal-text">
                {swimmer.firstName[0]}{swimmer.lastName[0]}
              </span>
            </div>

            <span className="flex-1">{swimmer.firstName} {swimmer.lastName}</span>

            <button onClick={() => removeSwimmer(swimmer.id)}>Delete</button>
          </div>
        )
      })}
      <div className="flex gap-2 p-3">
        <input
          type="text"
          name="firstName"
          value={swimmer.firstName}
          onChange={handleChange}
          placeholder="First Name"
        />
        <input
          type="text"
          name="lastName"
          value={swimmer.lastName}
          onChange={handleChange}
          placeholder="Last Name"
        />
        <button onClick={() => addSwimmer(swimmer)}>Add Swimmer</button>
      </div>
    </div>
  );
}
