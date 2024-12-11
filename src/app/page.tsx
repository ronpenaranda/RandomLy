import ChatComponent from './chatbox'
import supabase from "@/db/supabase";

const Page = async () => {
  const tempLogin = async (): Promise<any> => {
    const { data, error } = await supabase
      .from("temp_user")
      .insert([{ active: true, status: "standby" }])
      .select();

    if (error) {
      console.error("Error inserting user:", error);
    } else {
      return data?.[0];
    }
  };
  const user = await tempLogin()

  return (
    <div className='p-4'>
    Welcome to Randomly!
    <div className='lg:px-10'>
      <ChatComponent sender_id={`${user?.id}`}/>
    </div>
    </div>
  )
}

export default Page