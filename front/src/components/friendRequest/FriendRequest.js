import React, { useState, useEffect } from 'react'
import axios from '../../api/axios'
import './FriendRequest.css'
import UseFriendsStore from '../../store/UseFriendsStore'

import DefaultLogo from '../../assets/images/facebook-default-pfp.png'
import { RxDotsHorizontal } from "react-icons/rx";
import { MdBlock } from "react-icons/md";
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const FriendRequest = () => {

  const [dropdown, setDropdown] = useState(false)
  const { friendRequests, fetchFriendsReq, acceptReq, rejectReq } = UseFriendsStore()

  const openDropdown = () => {
    if(dropdown === false){
      setDropdown(true)
    }else{
      setDropdown(false)
    }
  }

  useEffect(() => {
    fetchFriendsReq()
  }, [fetchFriendsReq])


  return (
    <>
      <section className='friend_req_section'>
        <div className='friend_req_container'>
          <div className='friend_req_text'>
            <h1>Requests</h1>
          </div>
          
          <div className='friend_requests'>
            {friendRequests.map((req) => (
              <div key={req._id} className='friend_req_item'>
                <div className='friend_req_item_left'>
                  <img src={DefaultLogo} alt='user profile picture' />
                  <h3>{req.sender.name} {req.sender.lastname}</h3>
                </div>

                <div className='friend_req_det'>
                  <RxDotsHorizontal className='friend_req_det_icon' onClick={openDropdown} />

                  {dropdown && (
                    <>
                      <div className='dropdown'>
                        <div className='dropdown_container'>

                          <div onClick={() => acceptReq(req._id)}>
                            <div className='accept_icon_wrapper'>
                              <FaCheckCircle className='accept_icon' /> 
                            </div>
                            <h4>Accept</h4>
                          </div>

                          <div onClick={() => rejectReq(req._id)}>
                            <div className='accept_icon_wrapper'>
                              <FaTimesCircle className='accept_icon' /> 
                            </div>
                            <h4>Reject</h4>
                          </div>

                          <div>

                            <div className='accept_icon_wrapper'>
                              <MdBlock className='accept_icon' /> 
                            </div>
                            <h4>Block</h4>
                          </div>

                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>
            ))}
          </div>

        </div>
      </section>
    </>
  )
}

export default FriendRequest